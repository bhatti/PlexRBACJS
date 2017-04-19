/*@flow*/

const assert = require('assert');

import type {Claim}             from '../../domain/interface';
import type {Principal}         from '../../domain/interface';
import type {Role}              from '../../domain/interface';
import type {ClaimRepository}   from '../interface';
import type {RealmRepository}   from '../interface';
import {QueryOptions}           from '../interface';
import {ClaimImpl}              from '../../domain/claim';
import {PersistenceError}       from '../persistence_error';
import {DBHelper}               from './db_helper';
import {QueryHelper}            from './query_helper';

/**
 * ClaimRepositorySqlite implements ClaimRepository by defining data access methods for Claim objects
 */
export class ClaimRepositorySqlite implements ClaimRepository {
    dbHelper:           DBHelper;
    realmRepository:    RealmRepository;
    sqlPrefix:          string;


    constructor(theDBHelper: DBHelper, theRealmRepository: RealmRepository) {
        assert(theDBHelper, 'db-helper not specified');
        assert(theRealmRepository, 'realm-repository not specified');

        this.dbHelper           = theDBHelper;
        this.realmRepository    = theRealmRepository;
        this.sqlPrefix          = 'SELECT rowid AS id, realm_id, action, resource, condition FROM claims';
    }

    /**
     * This method finds object by id
     * @param {*} id - database id
     */
    async findById(id: number): Promise<Claim> {
        assert(id, 'claim-id not specified');
        let findPromise = new Promise((resolve, reject) => {
            this.dbHelper.db.get(`${this.sqlPrefix} WHERE rowid == ?`, id, (err, row) => {
                if (err) {
                    reject(new PersistenceError(`Could not find claim with id ${id} due to ${err}`));
                } else if (row) {
                    return this.__rowToClaim(row).
                    then(claim => {
                        resolve(claim);
                    }).catch(err => {
                        reject(new PersistenceError(`Could not find claim with id ${id} due to ${err}`));
                    });
                } else {
                    reject(new PersistenceError(`Could not find claim with id ${id}`));
                }
            });
        });
        return await findPromise;
    }

    async findByValue(claim: Claim): Promise<Claim> {
        assert(claim, 'claim-id not specified');
        assert(claim.realm && claim.realm.id, 'realm-id not specified');
        return new Promise((resolve, reject) => {
            this.dbHelper.db.get(`SELECT rowid AS id FROM claims WHERE realm_id = ? AND action == ? AND resource = ? AND condition = ?`,
                [claim.realm.id, claim.action, claim.resource, claim.condition], (err, row) => {
                if (err) {
                    reject(new PersistenceError(`Could not find claim with value ${String(claim)} due to ${err}`));
                } else if (row) {
                    claim.id = row.id;
                    resolve(claim);
                } else {
                    reject(new PersistenceError(`Could not locate claim with value ${String(claim)}`));
                }
            });
        });
    }

    /**
     * This method saves object and returns updated object
     * @param {*} Claim - to save
     */
    async save(claim: Claim): Promise<Claim> {
        assert(claim, 'claim-id not specified');
        assert(claim.realm && claim.realm.id, 'realm-id not specified');
        //
        try {
          return await this.findByValue(claim);
        } catch (err) {
            return this.__save(claim);
        }
    }

    async __save(claim: Claim): Promise<Claim> {
        return new Promise((resolve, reject) => {
            if (claim.id) {
                let stmt = this.dbHelper.db.prepare('UPDATE claims SET action = ?, resource = ?, condition = ? WHERE rowid = ? AND realm_id = ?');
                stmt.run(claim.action, claim.resource, claim.resource, claim.id, claim.realm.id);
                stmt.finalize(err => {
                    if (err) {
                        reject(new PersistenceError(`Could not save claim ${String(claim)} due to ${err}`));
                    } else {
                        resolve(claim);
                    }
                });
            } else {
                let stmt = this.dbHelper.db.prepare('INSERT INTO claims VALUES (?, ?, ?, ?)');
                stmt.run(claim.realm.id, claim.action, claim.resource, claim.condition, function(err) {
                    claim.id = this.lastID;
                });
                stmt.finalize((err) => {
                    if (err) {
                        reject(new PersistenceError(`Could not insert claim ${String(claim)} due to ${err}`));
                    } else {
                        resolve(claim);
                    }
                });
            }
        });
    }

    /**
     * This method removes object by id
     * @param {*} id - database id
     */
    async removeById(id: number): Promise<boolean> {
        assert(id, 'id not specified');
        return new Promise((resolve, reject) => {
			      this.dbHelper.db.run('DELETE FROM claims WHERE rowid = ?', id, (err) => {
				        if (err) {
					          reject(new PersistenceError(`Failed to delete claim with id ${id}`));
				        } else {
        			      this.dbHelper.db.run('DELETE FROM principals_claims WHERE claim_id = ?', id, (err) => {
						            if (err) {
							              reject(new PersistenceError(`Failed to delete claim with id ${id}`));
						            } else {
							              resolve(true);
						            }
					          });
				        }
			      });
		    });
    }

    /**
     * This method queries database and returns list of objects
     */
    async search(criteria: Map<string, any>, options?: QueryOptions): Promise<Array<Claim>> {
        let q:QueryHelper<Claim> = new QueryHelper(this.dbHelper.db);
        return q.query(this.sqlPrefix, criteria, (row) => {
            return this.__rowToClaim(row);
         }, options);
    }

    /**
     * This method save claims for principal
     */
    async __savePrincipalClaims(principal: Principal): Promise<Principal> {
        assert(principal && principal.id, 'principal not specified');

        let deletePromise = new Promise((resolve, reject) => {
            this.dbHelper.db.run('DELETE FROM principals_claims WHERE principal_id = ?',
            principal.id, (err) => {
                if (err) {
                    reject(new PersistenceError(`Failed to delete claim from principal due to ${err}`));
                } else {
                    resolve();
                }
            });
        });
        await deletePromise;
        //
        let savePromises = [];
        principal.claims.forEach(claim => {
            savePromises.push(new Promise((resolve, reject) => {
                this.save(claim).then(saved => {
                    resolve(saved);
                }).catch(err => {
                    reject(err);
                });
            }));
        });
        await Promise.all(savePromises);
        //
        let relationPromises = [];
        principal.claims.forEach(claim => {
            relationPromises.push(new Promise((resolve, reject) => {
                        this.dbHelper.db.run('INSERT INTO principals_claims VALUES (?, ?)',
                        principal.id, claim.id, (err) => {
                            principal.claims.add(claim);
                            resolve(claim);
                        });
                    }));
        });
        await Promise.all(relationPromises);
        return principal;
    }


    /**
     * This method save claims for role
     */
    async __saveRoleClaims(role: Role): Promise<Role> {
        assert(role && role.id, 'role not specified');

        let deletePromise = new Promise((resolve, reject) => {
            this.dbHelper.db.run('DELETE FROM roles_claims WHERE role_id = ?',
            role.id, (err) => {
                if (err) {
                    reject(new PersistenceError(`Failed to delete claim from role due to ${err}`));
                } else {
                    resolve();
                }
            });
        });
        await deletePromise;

        let savePromises = [];
        role.claims.forEach(claim => {
            savePromises.push(new Promise((resolve, reject) => {
                this.save(claim).then(saved => {
                    resolve(saved);
                }).catch(err => {
                    reject(err);
                });
            }));
        });
        await Promise.all(savePromises);
        //
        let relationPromises = [];
        role.claims.forEach(claim => {
            relationPromises.push(new Promise((resolve, reject) => {
                this.dbHelper.db.run('INSERT INTO roles_claims VALUES (?, ?)',
                role.id, claim.id, (err) => {
                    role.claims.add(claim);
                    resolve(claim);
                });
            }));
        });
        await Promise.all(relationPromises);
        return role;
    }

    /**
     * This method returns claims by principal that are associated to principal roles or directly to principal
     */
    async __loadPrincipalClaims(principal: Principal): Promise<Principal>  {
        assert(principal && principal.id, 'principal not specified');

        let criteria: Map<string, any> = new Map();
        criteria.set('principal_id', principal.id);

        let q:QueryHelper<Claim> = new QueryHelper(this.dbHelper.db);
        await q.query(
                'SELECT principal_id, claim_id AS id, realm_id, action, resource, condition ' +
                'FROM principals_claims INNER JOIN claims on claims.rowid = principals_claims.claim_id',
                criteria, (row) => {
                return this.__rowToClaim(row).then(claim => {
                    principal.claims.add(claim);
                });
            });
        return principal;
    }

    /**
     * This method load claims for role
     */
    async __loadRoleClaims(role: Role): Promise<Role> {
        assert(role, 'role not specified');

        let criteria: Map<string, any> = new Map();
        criteria.set('role_id', role.id);

        let q:QueryHelper<Claim> = new QueryHelper(this.dbHelper.db);
        await q.query(
                'SELECT role_id, claim_id AS id, realm_id, action, resource, condition ' +
                'FROM roles_claims INNER JOIN claims on claims.rowid = roles_claims.claim_id',
                criteria, (row) => {
                return this.__rowToClaim(row).then(claim => {
                    role.claims.add(claim);
                });
            });
        return role;
    }


    async __rowToClaim(row: any): Promise<Claim> {
        let promise     = this.realmRepository.findById(row.realm_id);
        let realm       = await promise;
        let claim = new ClaimImpl(realm, row.action, row.resource, row.condition);
        claim.id = row.id;
        return claim;
    }
}
