/*@flow*/
const assert = require('assert');

import type {IPrincipal}            from '../../domain/interface';
import type {PrincipalRepository}   from '../interface';
import type {RoleRepository}        from '../interface';
import type {RealmRepository}       from '../interface';
import type {ClaimRepository}       from '../interface';
import {QueryOptions}               from '../interface';
import {Principal}                  from '../../domain/principal';
import {PersistenceError}           from '../persistence_error';
import {DBFactory}                  from './db_factory';
import {QueryHelper}                from './query_helper';
import type {SecurityCache}         from '../../cache/interface';

/**
 * PrincipalRepositorySqlite implements PrincipalRepository by defining
 * data access methods for principal objects
 */
export class PrincipalRepositorySqlite implements PrincipalRepository {
    dbFactory:          DBFactory;
    realmRepository:    RealmRepository;
    roleRepository:     RoleRepository;
    claimRepository:    ClaimRepository;
    sqlPrefix:          string;
    cache:              SecurityCache;

    constructor(theDBFactory: DBFactory,
        theRealmRepository: RealmRepository,
        theRoleRepository: RoleRepository,
        theClaimRepository: ClaimRepository,
        theCache: SecurityCache) {
        assert(theDBFactory, 'db-helper not specified');
        assert(theRealmRepository, 'realm-repository not specified');
        assert(theRoleRepository, 'role-repository not specified');
        assert(theClaimRepository, 'claim-repository not specified');
        assert(theCache, 'cache not specified');
        this.dbFactory          = theDBFactory;
        this.realmRepository    = theRealmRepository;
        this.roleRepository     = theRoleRepository;
        this.claimRepository    = theClaimRepository;
        this.cache              = theCache;
        this.sqlPrefix          = 'SELECT rowid AS id, principal_name, realm_id FROM principals';
    }

    /**
     * This method finds principal by id
     * @param {*} id - database id
     */
    async findById(id: number): Promise<IPrincipal> {
        assert(id, 'principal-id not specified');

        return new Promise((resolve, reject) => {
            this.dbFactory.db.get(`${this.sqlPrefix} WHERE rowid == ?`, id, (err, row) => {
                if (err) {
                    reject(new PersistenceError(`Could not find principal with id ${id}`));
                } else if (row) {
                    return this.__rowToPrincipal(row).
                        then(principal => {
                        resolve(principal);
                    });
                } else {
                    reject(new PersistenceError(`Could not find principal with id ${id}`));
                }
            });
        });
    }

    /**
     * This method finds principal by name
     * @param {*} realmName
     * @param {*} principalName
     */
    async findByName(realmName: string, principalName: string): Promise<IPrincipal> {
        assert(realmName, 'realm-name not specified');
        assert(principalName, 'principal-name not specified');

        return new Promise((resolve, reject) => {
            this.realmRepository.findByName(realmName).then(realm => {
                this.dbFactory.db.get(
                    `${this.sqlPrefix} WHERE realm_id = ? AND principal_name == ?`,
                  realm.id, principalName, (err, row) => {
                    if (err) {
                        reject(new PersistenceError(`Could not find principal with name ${principalName}`));
                    } else if (row) {
                        this.__rowToPrincipal(row).then(principal => {
                            resolve(principal);
                        });
                    } else {
                        reject(new PersistenceError(`Could not find principal with name ${principalName}`));
                    }
                  });
            }).catch(err => {
                reject(err);
            });
        });
    }

    /**
     * This method saves object and returns updated object
     * @param {*} principal - to save
     */
    async save(principal: IPrincipal): Promise<IPrincipal> {
        assert(principal, 'principal not specified');
        assert(principal.realm && principal.realm().id, 'realm-id for principal not specified');

        let loaded = null;
        if (!principal.id && principal.realm().realmName) {
            try {
                loaded = await this.findByName(principal.realm().realmName, principal.principalName);
                if (loaded) {
                    principal.id = loaded.id;
                }
            } catch (err) {
            }
        }

        let savePrincipal = new Promise((resolve, reject) => {
            if (principal.id) {
                if (loaded && loaded.principalName !== principal.principalName) {
                    let stmt = this.dbFactory.db.prepare('UPDATE principals SET principal_name = ? WHERE rowid = ?');
                    stmt.run(principal.principalName, principal.realm().id);
                    stmt.finalize(err => {
                        if (err) {
                            reject(new PersistenceError(`Could not save principal ${String(principal)} due to ${err}`));
                        } else {
                            resolve(principal);
                        }
                    });
                } else {
                    resolve(principal);
                }
            } else {
                let stmt = this.dbFactory.db.prepare('INSERT INTO principals VALUES (?, ?)');
                stmt.run(principal.realm().id, principal.principalName, function(err) {
                    principal.id = this.lastID;
                });
                stmt.finalize(() => {
                    resolve(principal);
                });
            }
        });

        await savePrincipal;
        //
        await this.roleRepository.__savePrincipalRoles(principal);
        await this.claimRepository.__savePrincipalClaims(principal);
        return savePrincipal;

    }

    /**
     * This method removes object by id
     * @param {*} id - database id
     */
    async removeById(id: number): Promise<boolean> {
        assert(id, 'principal-id not specified');

        let mainPromise = new Promise((resolve, reject) => {
                            this.dbFactory.db.run('DELETE FROM principals WHERE rowid = ?', id, (err) => {
                                  if (err) {
                                        reject(new PersistenceError(`Failed to remove principal ${id}`));
                                  } else {
                                        resolve(true);
                                  }
                            });
                  });
        let claimPromise = new Promise((resolve, reject) => {
                            this.dbFactory.db.run('DELETE FROM principals_claims WHERE principal_id = ?', id, (err) => {
                                  if (err) {
                                        reject(new PersistenceError(`Failed to remove principal ${id}`));
                                  } else {
                                        resolve(true);
                                  }
                            });
                  });
        let rolePromise = new Promise((resolve, reject) => {
                            this.dbFactory.db.run('DELETE FROM principals_roles WHERE principal_id = ?', id, (err) => {
                                  if (err) {
                                        reject(new PersistenceError(`Failed to remove principal ${id}`));
                                  } else {
                                        resolve(true);
                                  }
                            });
                  });
        return await Promise.all([mainPromise, claimPromise, rolePromise]);
    }

    /**
     * This method queries database and returns list of objects
     */
    async search(criteria: Map<string, any>, options?: QueryOptions): Promise<Array<IPrincipal>> {
        let q:QueryHelper<Principal> = new QueryHelper(this.dbFactory.db);
        return q.query(this.sqlPrefix, criteria, (row) => {
             return this.__rowToPrincipal(row);
         }, options);
    }

    async __rowToPrincipal(row: any): Promise<IPrincipal> {
        let realm       = await this.realmRepository.findById(row.realm_id);
        let principal   = new Principal(realm, row.principal_name);
        principal.id = row.id;
        await this.claimRepository.__loadPrincipalClaims(principal);
        await this.roleRepository.__loadPrincipalRoles(principal);
        return principal;
    }
}
