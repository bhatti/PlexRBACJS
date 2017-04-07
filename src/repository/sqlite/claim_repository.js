/*@flow*/

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
        if (!theDBHelper) {
            throw new PersistenceError('db-helper not specified');
        }
        if (!theRealmRepository) {
            throw new PersistenceError('realm-repository not specified');
        }
        this.dbHelper           = theDBHelper;
        this.realmRepository    = theRealmRepository;
        this.sqlPrefix          = 'SELECT rowid AS id, realm_id, action, resource, condition FROM claims';
    }

    /**
     * This method finds object by id
     * @param {*} id - database id
     */
    findById(id: number): Promise<Claim> {
        if (!id) {
            return Promise.reject(new PersistenceError('claim-id not specified'));
        }
        var Claim = null;
        //
        return new Promise((resolve, reject) => {
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
    }

    /**
     * This method saves object and returns updated object
     * @param {*} Claim - to save
     */
    save(claim: Claim): Promise<Claim> {
        if (!claim) {
            return Promise.reject(new PersistenceError('claim not specified'));
        }
        let db = this.dbHelper.db;
        if (claim.id) {
            return new Promise((resolve, reject) => {
				let stmt = db.prepare('UPDATE claims SET action = ?, resource = ?, condition = ?');
				stmt.run(claim.action, claim.resource, claim.resource);
				stmt.finalize(err => {
					if (err) {
						reject(new PersistenceError(`Could not save claim ${String(claim)} due to ${err}`));
					} else {
						resolve(claim);
					}
				});
            });
        } else {
            return new Promise((resolve, reject) => {
                db.serialize(() => {
                    let stmt = db.prepare('INSERT INTO claims VALUES (?, ?, ?, ?)');
                    stmt.run(claim.realm.id, claim.action, claim.resource, claim.condition);
                    stmt.finalize((err) => {
                        if (err) {
                            reject(new PersistenceError(`Could not insert claim ${String(claim)} due to ${err}`));
                        } else {
                            db.get('SELECT last_insert_rowid() AS lastID', (err, row) => {
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
            });
        }
    }

    /**
     * This method removes object by id
     * @param {*} id - database id
     */
    removeById(id: number): Promise<boolean> {
        if (!id) {
            return Promise.reject(new PersistenceError('id not specified'));
        }
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
    search(criteria: Map<string, any>, options?: QueryOptions): Promise<Array<Claim>> {
        let q:QueryHelper<Claim> = new QueryHelper(this.dbHelper.db);
        return q.query(this.sqlPrefix, criteria, (row) => {
            return this.__rowToClaim(row);
         }, options);
    }

    /**
     * This method adds claims to principal
     */
    addClaimToPrincipal(principal: Principal, claim: Claim): Promise<void> {
        if (!principal) {
            return Promise.reject(new PersistenceError('principal not specified'));
        }
        if (!claim) {
            return Promise.reject(new PersistenceError('claim not specified'));
        }
        return new Promise((resolve, reject) => {
            this.dbHelper.db.run('INSERT INTO principals_claims VALUES (?, ?)', 
                principal.id, claim.id, (err) => {
                    if (err) {
                        reject(new PersistenceError(`Could not add Claim ${String(claim)} to principal ${String(principal)} due to ${err}`));
                    } else {
                        principal.claims.add(claim);
                        resolve();
                    }
                });
        });
    }

    /**
     * This method adds claims to role
     */
    addClaimToRole(role: Role, claim: Claim): Promise<void> {
        if (!role) {
            return Promise.reject(new PersistenceError('role not specified'));
        }
        if (!claim) {
            return Promise.reject(new PersistenceError('claim not specified'));
        }
        return new Promise((resolve, reject) => {
            this.dbHelper.db.run('INSERT INTO roles_claims VALUES (?, ?)', 
                role.id, claim.id, (err) => {
                    if (err) {
                        reject(new PersistenceError(`Could not add Claim ${String(claim)} to role ${String(role)} due to ${err}`));
                    } else {
                        role.claims.add(claim);
                        resolve();
                    }
                });
        });
    }


    /**
     * This method removes claims from principal
     */
    removeClaimFromPrincipal(principal: Principal, claim: Claim): Promise<void> {
        if (!principal) {
            return Promise.reject(new PersistenceError('principal not specified'));
        }
        if (!claim) {
            return Promise.reject(new PersistenceError('claim not specified'));
        }
        return new Promise((resolve, reject) => {
            this.dbHelper.db.run('DELETE FROM principals_claims WHERE principal_id = ? and claim_id = ?', principal.id, claim.id, (err) => {
                if (err) {
                    reject(new PersistenceError(`Failed to delete claim from principal due to ${err}`));
                } else {
                    resolve();
                    principal.claims.delete(claim);
                }
            });
        });
    }

    /**
     * This method remove claims from role
     */
    removeClaimFromRole(role: Role, claim: Claim) : Promise<void> {
        if (!role) {
            return Promise.reject(new PersistenceError('role not specified'));
        }
        if (!claim) {
            return Promise.reject(new PersistenceError('claim not specified'));
        }
        return new Promise((resolve, reject) => {
            this.dbHelper.db.run('DELETE FROM roles_claims WHERE role_id = ? and claim_id = ?', role.id, claim.id, (err) => {
                if (err) {
                    reject(new PersistenceError(`Failed to delete claim from role due to ${err}`));
                } else {
                    resolve();
                    role.claims.delete(claim);
                }
            });
        });
    }

    /**
     * This method returns claims by principal that are associated to principal roles or directly to principal
     */
    loadPrincipalClaims(principal: Principal): Promise<void>  {
        if (!principal) {
            return Promise.reject(new PersistenceError('principal not specified'));
        }
        let criteria: Map<string, any> = new Map();
        criteria.set('principal_id', principal.id);

        let q:QueryHelper<Claim> = new QueryHelper(this.dbHelper.db);
        return q.query(
            'SELECT principal_id, claim_id AS id, realm_id, action, resource, condition ' +
            'FROM principals_claims INNER JOIN claims on claims.rowid = principals_claims.claim_id', 
            criteria, (row) => {
            return this.__rowToClaim(row).
            then(claim => {
                principal.claims.add(claim);
                return claim;
            });
         });
    }

    /**
     * This method load claims for role
     */
    loadRoleClaims(role: Role): Promise<void> {
        if (!role) {
            return Promise.reject(new PersistenceError('role not specified'));
        }
        let criteria: Map<string, any> = new Map();
        criteria.set('role_id', role.id);

        let q:QueryHelper<Claim> = new QueryHelper(this.dbHelper.db);
        return q.query(
            'SELECT role_id, claim_id AS id, realm_id, action, resource, condition ' +
            'FROM roles_claims INNER JOIN claims on claims.rowid = roles_claims.claim_id', 
            criteria, (row) => {
            return this.__rowToClaim(row).
            then(claim => {
                role.claims.add(claim);
                return claim;
            }).catch(err => {
                throw new PersistenceError(`Failed to load role claims for ${String(role)} due to ${err}`);
            })
         });
    }


    __rowToClaim(row: any): Promise<Claim> {
        return this.realmRepository.findById(row.realm_id).
        then(realm => {
            return new ClaimImpl(row.id, realm, row.action, row.resource, row.condition);
        }).catch(err => {
            throw new PersistenceError(`Could not find realm for claim ${row} due to ${err}`);
        });
    }

}
