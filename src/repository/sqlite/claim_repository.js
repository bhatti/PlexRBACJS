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
    findById(id: number): Promise<Claim> {
        if (!id) {
            return Promise.reject(new PersistenceError('claim-id not specified'));
        }
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

    findByValue(claim: Claim): Promise<Claim> {
        if (!claim) {
            return Promise.reject(new PersistenceError('claim not specified'));
        }
        if (!claim.realm || !claim.realm.id) {
            return Promise.reject(new PersistenceError('realm-id not specified'));
        }
        let criteria = new Map();
        criteria.set('realm_id', claim.realm.id);
        criteria.set('action', claim.action);
        criteria.set('resource', claim.resource);
        criteria.set('condition', claim.condition);

        //
        return new Promise((resolve, reject) => {
            this.search(criteria).
            then(results => {
                if (results.length > 0) {
                    resolve(results[0]);
                } else {
                    reject(new PersistenceError(`Could not locate any claim with value ${String(claim)}`));
                }
            }).catch(err => {
                reject(err);
            });
        });
    }

    _findByValue(claim: Claim): Promise<Claim> {
        if (!claim) {
            return Promise.reject(new PersistenceError('claim not specified'));
        }
        if (!claim.realm || !claim.realm.id) {
            return Promise.reject(new PersistenceError('realm-id not specified'));
        }
        //
        return new Promise((resolve, reject) => {
            this.dbHelper.db.get(`SELECT rowid AS id FROM claims WHERE realm_id = ? AND action == ? AND resource = ? AND condition = ?`,
                [claim.realm.id, claim.action, claim.resource, claim.condition], (err, row) => {
                if (err) {
                    reject(new PersistenceError(`Could not find claim with value ${String(claim)} due to ${err}`));
                } else if (row) {
                    claim.id = row.id;
                    resolve(claim);
                } else {
                    reject(new PersistenceError(`Could not locate claim with value ${String(claim)} -- ${err} -- ${row}`));
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
        if (!claim.realm || !claim.realm.id) {
            return Promise.reject(new PersistenceError('realm-id not specified'));
        }
        //
        let db = this.dbHelper.db;
        return new Promise((resolve, reject) => {
            this.findByValue(claim).
            then(loaded => {
                return resolve(loaded); // nothing to save
            }).catch(err => {
                if (claim.id) {
                    let stmt = db.prepare('UPDATE claims SET action = ?, resource = ?, condition = ? WHERE rowid = ? AND realm_id = ?');
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

                    db.serialize(() => {
                        let stmt = db.prepare('INSERT INTO claims VALUES (?, ?, ?, ?)');
                        stmt.run(claim.realm.id, claim.action, claim.resource, claim.condition);
                        stmt.finalize((err) => {
                            if (err) {
                                console.log(`---------------------Could not add claim ${claim.id} -- ${String(claim)} -- ${err.stack}`);

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
                }
            });
        });

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
    addClaimsToPrincipal(principal: Principal, claims: Set<Claim>): Promise<Principal> {
        if (!principal) {
            return Promise.reject(new PersistenceError('principal not specified'));
        }
        if (!claims) {
            return Promise.reject(new PersistenceError('claims not specified'));
        }
        return new Promise((resolve, reject) => {
            this.dbHelper.db.serialize(() => {
                claims.forEach(claim => {
                    this.save(claim).
                    then(saved => {
                        this.dbHelper.db.run('INSERT INTO principals_claims VALUES (?, ?)',
                            principal.id, saved.id, (err) => {
                                if (!err) {
                                    principal.claims.add(claim);
                                }
                            });
                    }).catch(err => {
                        reject(new PersistenceError(`claim could not be added due to ${err}`));
                    });
                });
                resolve(principal);
            });
        });
    }


    /**
     * This method removes claims from principal
     */
    removeClaimsFromPrincipal(principal: Principal, claims: Set<Claim>): Promise<Principal> {
        if (!principal) {
            return Promise.reject(new PersistenceError('principal not specified'));
        }
        if (!claims) {
            return Promise.reject(new PersistenceError('claims not specified'));
        }
        return new Promise((resolve, reject) => {
            claims.forEach(claim => {
                this.dbHelper.db.run('DELETE FROM principals_claims WHERE principal_id = ? and claim_id = ?', principal.id, claim.id, (err) => {
                    if (err) {
                        reject(new PersistenceError(`Failed to delete claim from principal due to ${err}`));
                    } else {
                        principal.claims.delete(claim);
                    }
                });
            });
            resolve(principal);
        });
    }


    /**
     * This method adds claims to role
     */
    addClaimsToRole(role: Role, claims: Set<Claim>): Promise<Role> {
        if (!role) {
            return Promise.reject(new PersistenceError('role not specified'));
        }
        if (!claims) {
            return Promise.reject(new PersistenceError('claims not specified'));
        }
        return new Promise((resolve, reject) => {
            this.dbHelper.db.serialize(() => {
                claims.forEach(claim => {
                    this.save(claim).
                    then(saved => {
                        this.dbHelper.db.run('INSERT INTO roles_claims VALUES (?, ?)',
                            role.id, saved.id, (err) => {
                                if (!err) {
                                    role.claims.add(claim);
                                }
                            });
                    }).catch(err => {
                        reject(new PersistenceError(`claim could not be added due to ${err}`));
                    });
                });
                resolve(role);
            });
        });
    }


    /**
     * This method remove claims from role
     */
    removeClaimsFromRole(role: Role, claims: Set<Claim>) : Promise<*> {
        if (!role) {
            return Promise.reject(new PersistenceError('role not specified'));
        }
        if (!claims) {
            return Promise.reject(new PersistenceError('claims not specified'));
        }
        return new Promise((resolve, reject) => {
            claims.forEach(claim => {
                this.dbHelper.db.run('DELETE FROM roles_claims WHERE role_id = ? and claim_id = ?', role.id, claim.id, (err) => {
                    if (err) {
                        reject(new PersistenceError(`Failed to delete claim from role due to ${err}`));
                    } else {
                        role.claims.delete(claim);
                    }
                });
            });
            resolve(role);
        });
    }

    /**
     * This method returns claims by principal that are associated to principal roles or directly to principal
     */
    loadPrincipalClaims(principal: Principal): Promise<Principal>  {
        if (!principal) {
            return Promise.reject(new PersistenceError('principal not specified'));
        }
        let criteria: Map<string, any> = new Map();
        criteria.set('principal_id', principal.id);

        let q:QueryHelper<Claim> = new QueryHelper(this.dbHelper.db);
        return new Promise((resolve, reject) => {
            q.query(
                'SELECT principal_id, claim_id AS id, realm_id, action, resource, condition ' +
                'FROM principals_claims INNER JOIN claims on claims.rowid = principals_claims.claim_id',
                criteria, (row) => {
                return this.__rowToClaim(row).
                then(claim => {
                    console.log(`>>>>Adding claim ${String(claim)} to principal ${String(principal)}`);
                    principal.claims.add(claim);
                    return claim;
                });
            }).then(result => {
                resolve(principal);
            }).catch(err => {
                reject(err);
            });
        });
    }

    /**
     * This method load claims for role
     */
    loadRoleClaims(role: Role): Promise<Role> {
        if (!role) {
            return Promise.reject(new PersistenceError('role not specified'));
        }
        let criteria: Map<string, any> = new Map();
        criteria.set('role_id', role.id);

        let q:QueryHelper<Claim> = new QueryHelper(this.dbHelper.db);
        return new Promise((resolve, reject) => {
            q.query(
                'SELECT role_id, claim_id AS id, realm_id, action, resource, condition ' +
                'FROM roles_claims INNER JOIN claims on claims.rowid = roles_claims.claim_id',
                criteria, (row) => {
                return this.__rowToClaim(row).
                then(claim => {
                    role.claims.add(claim);
                    console.log(`>>>>Adding claim ${String(claim)} to role ${String(role)}`);
                    return claim;
                }).catch(err => {
                    throw new PersistenceError(`Failed to load role claims for ${String(role)} due to ${err}`);
                })
            }).then(result => {
                resolve(role);
            }).catch(err => {
                reject(err);
            });
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
