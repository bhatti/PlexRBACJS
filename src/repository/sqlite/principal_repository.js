/*@flow*/
const assert = require('assert');

import type {Principal}             from '../../domain/interface';
import type {PrincipalRepository}   from '../interface';
import type {RoleRepository}        from '../interface';
import type {RealmRepository}       from '../interface';
import type {ClaimRepository}       from '../interface';
import {QueryOptions}               from '../interface';
import {PrincipalImpl}              from '../../domain/principal';
import {PersistenceError}           from '../persistence_error';
import {DBHelper}                   from './db_helper';
import {QueryHelper}                from './query_helper';
import type {SecurityCache}         from '../../cache/interface';

/**
 * PrincipalRepositorySqlite implements PrincipalRepository by defining
 * data access methods for principal objects
 */
export class PrincipalRepositorySqlite implements PrincipalRepository {
    dbHelper:           DBHelper;
    realmRepository:    RealmRepository;
    roleRepository:     RoleRepository;
    claimRepository:    ClaimRepository;
    sqlPrefix:          string;
    cache:              SecurityCache;

    constructor(theDBHelper: DBHelper,
        theRealmRepository: RealmRepository,
        theRoleRepository: RoleRepository,
        theClaimRepository: ClaimRepository,
        theCache: SecurityCache) {
        assert(theDBHelper, 'db-helper not specified');
        assert(theRealmRepository, 'realm-repository not specified');
        assert(theRoleRepository, 'role-repository not specified');
        assert(theClaimRepository, 'claim-repository not specified');
        assert(theCache, 'cache not specified');
        this.dbHelper           = theDBHelper;
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
    async findById(id: number): Promise<Principal> {
        assert(id, 'principal-id not specified');

        return new Promise((resolve, reject) => {
            this.dbHelper.db.get(`${this.sqlPrefix} WHERE rowid == ?`, id, (err, row) => {
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
    async findByName(realmName: string, principalName: string): Promise<Principal> {
        assert(realmName, 'realm-name not specified');
        assert(principalName, 'principal-name not specified');

        return new Promise((resolve, reject) => {
            this.realmRepository.findByName(realmName).then(realm => {
                this.dbHelper.db.get(
                    `${this.sqlPrefix} WHERE realm_id = ? AND principal_name == ?`,
                  realm.id, principalName, (err, row) => {
                    if (err) {
                        reject(new PersistenceError(`Could not find principal with name ${principalName}`));
                    } else if (row) {
                        this.__rowToPrincipal(row).then(principal => {
                            resolve(principal);
                        });
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
    async save(principal: Principal): Promise<Principal> {
        assert(principal, 'principal not specified');
        assert(principal.realm && principal.realm.id, 'realm-id not specified');

        if (principal.id) {
            throw new PersistenceError(`Principal is immutable and cannot be updated ${String(principal)}`);
        } else {
            return new Promise((resolve, reject) => {
                let stmt = this.dbHelper.db.prepare('INSERT INTO principals VALUES (?, ?)');
                stmt.run(principal.realm.id, principal.principalName, function(err) {
                    principal.id = this.lastID;
                });
                stmt.finalize(() => {
                    resolve(principal);
                });
            });
        }
    }

    /**
     * This method removes object by id
     * @param {*} id - database id
     */
    async removeById(id: number): Promise<boolean> {
        assert(id, 'principal-id not specified');

        let removePromise = new Promise((resolve, reject) => {
			                this.dbHelper.db.run('DELETE FROM principals_claims WHERE principal_id = ?', id, (err) => {});
			                this.dbHelper.db.run('DELETE FROM principals_roles WHERE principal_id = ?', id, (err) => {});
			                this.dbHelper.db.run('DELETE FROM principals WHERE rowid = ?', id, (err) => {
				                  if (err) {
					                    reject(new PersistenceError(`Failed to remove principal ${id}`));
				                  } else {
					                    resolve(true);
				                  }
			                });
	              });
        return await removePromise;
    }

    /**
     * This method queries database and returns list of objects
     */
    async search(criteria: Map<string, any>, options?: QueryOptions): Promise<Array<Principal>> {
        let q:QueryHelper<Principal> = new QueryHelper(this.dbHelper.db);
        return q.query(this.sqlPrefix, criteria, (row) => {
             return this.__rowToPrincipal(row);
         }, options);
    }

    async __rowToPrincipal(row: any): Promise<Principal> {
        let realm       = await this.realmRepository.findById(row.realm_id);
        let principal   = new PrincipalImpl(row.id, realm, row.principal_name);
        await this.claimRepository.loadPrincipalClaims(principal);
        await this.roleRepository.loadPrincipalRoles(principal);
        return principal;
    }
}
