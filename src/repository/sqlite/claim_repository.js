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
        let savePromise = new Promise((resolve, reject) => {
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
                //console.log(`-------Adding -- ${String(claim)} -- ${err.stack}`);
                this.dbHelper.db.serialize(() => {
                    let stmt = this.dbHelper.db.prepare('INSERT INTO claims VALUES (?, ?, ?, ?)');
                    stmt.run(claim.realm.id, claim.action, claim.resource, claim.condition);
                    stmt.finalize((err) => {
                        if (err) {
                            console.log(`---------------------Could not add claim ${claim.id} -- ${String(claim)} -- ${err.stack}`);
                            reject(new PersistenceError(`Could not insert claim ${String(claim)} due to ${err}`));
                        } else {
                            this.dbHelper.db.get('SELECT last_insert_rowid() AS lastID', (err, row) => {
                                claim.id = row.lastID;
                                if (err) {
                                    reject(new PersistenceError(`Could not insert claim ${String(claim)} due to ${err}`));
                                } else {
                                    resolve(claim);
                                }
                            });
                        }
                    });
                });
            }
        });
        return savePromise;
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
     * This method adds claims to principal
     */
    async addClaimsToPrincipal(principal: Principal, claims: Set<Claim>): Promise<Principal> {
        assert(principal, 'principal not specified');
        assert(claims, 'claims not specified');

        let promises   = [];
        claims.forEach(claim => {
            this.save(claim).then(saved => {
                promises.push(new Promise((resolve, reject) => {
                        this.dbHelper.db.run('INSERT INTO principals_claims VALUES (?, ?)',
                        principal.id, saved.id, (err) => {
                            if (err) {
                                reject(new PersistenceError(`Failed to add claim to principal due to ${err}`));
                            } else {
                                principal.claims.add(saved);
                                resolve(saved);
                            }
                        });
                    }));
            });
        });
        await Promise.all(promises);
        return principal;
    }


    /**
     * This method removes claims from principal
     */
    async removeClaimsFromPrincipal(principal: Principal, claims: Set<Claim>): Promise<Principal> {
        assert(principal, 'principal not specified');
        assert(claims, 'claims not specified');
        let promises = [];
        claims.forEach(claim => {
            promises.push(new Promise((resolve, reject) => {
                this.dbHelper.db.run('DELETE FROM principals_claims WHERE principal_id = ? and claim_id = ?',
                principal.id, claim.id, (err) => {
                    if (err) {
                        reject(new PersistenceError(`Failed to delete claim from principal due to ${err}`));
                    } else {
                        principal.claims.delete(claim);
                        resolve(claim);
                    }
                });
            }));
        });
        await promises;
        return principal;
    }


    /**
     * This method adds claims to role
     */
    async addClaimsToRole(role: Role, claims: Set<Claim>): Promise<Role> {
        assert(role, 'role not specified');
        assert(claims, 'claims not specified');

        let promises   = [];
        claims.forEach(claim => {
            promises.push(new Promise((resolve, reject) => {
                this.save(claim).then(saved => {
                    this.dbHelper.db.run('INSERT INTO roles_claims VALUES (?, ?)',
                    role.id, saved.id, (err) => {
                    if (err) {
                        reject(new PersistenceError(`Failed to delete claim from principal due to ${err}`));
                    } else {
                        role.claims.add(claim);
                        resolve(claim);
                    }
                });
            });
        }));
        });
        await promises;
        return role;
    }


    /**
     * This method remove claims from role
     */
    async removeClaimsFromRole(role: Role, claims: Set<Claim>) : Promise<Role> {
        assert(role, 'role not specified');
        assert(claims, 'claims not specified');
        let promises = [];
        claims.forEach(claim => {
            promises.push(new Promise((resolve, reject) => {
                this.dbHelper.db.run('DELETE FROM roles_claims WHERE role_id = ? and claim_id = ?',
                role.id, claim.id, (err) => {
                    if (err) {
                        reject(new PersistenceError(`Failed to delete claim from role due to ${err}`));
                    } else {
                        role.claims.delete(claim);
                        resolve(claim);
                    }
                });
            }));
        });
        await promises;
        return role;
    }

    /**
     * This method returns claims by principal that are associated to principal roles or directly to principal
     */
    async loadPrincipalClaims(principal: Principal): Promise<Principal>  {
        assert(principal, 'principal not specified');

        let criteria: Map<string, any> = new Map();
        criteria.set('principal_id', principal.id);

        let q:QueryHelper<Claim> = new QueryHelper(this.dbHelper.db);
        await q.query(
                'SELECT principal_id, claim_id AS id, realm_id, action, resource, condition ' +
                'FROM principals_claims INNER JOIN claims on claims.rowid = principals_claims.claim_id',
                criteria, (row) => {
                return this.__rowToClaim(row).then(claim => {
                    principal.claims.add(claim);
                    console.log(`>>>>Adding claim ${String(claim)} to principal ${String(principal)}`);
                });
                });
        return principal;
    }

    /**
     * This method load claims for role
     */
    async loadRoleClaims(role: Role): Promise<Role> {
        assert(role, 'role not specified');

        let criteria: Map<string, any> = new Map();
        criteria.set('role_id', role.id);

        let q:QueryHelper<Claim> = new QueryHelper(this.dbHelper.db);
        await q.query(
                'SELECT role_id, claim_id AS id, realm_id, action, resource, condition ' +
                'FROM roles_claims INNER JOIN claims on claims.rowid = roles_claims.claim_id',
                criteria, (row) => {
                return this.__rowToClaim(row).then(claim => {
                    console.log(`>>>>Adding claim ${String(claim)} to role ${String(role)}`);
                    role.claims.add(claim);
                });
            });
        return role;
    }


    async __rowToClaim(row: any): Promise<Claim> {
        let promise     = this.realmRepository.findById(row.realm_id);
        let realm       = await promise;
        return new ClaimImpl(row.id, realm, row.action, row.resource, row.condition);
    }
}
