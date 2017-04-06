/*@flow*/

import type {Principal}             from '../../domain/interface';
import type {PrincipalRepository}   from '../interface';
import type {RoleRepository}        from '../interface';
import type {RealmRepository}       from '../interface';
import type {ClaimRepository}       from '../interface';
import {QueryOptions}               from '../interface';
import {PrincipalImpl}              from '../../domain/principal';
import {PersistenceError}           from '../persistence_error';
import {DBHelper}                   from './db_helper';
import {QueryHelper}            from './query_helper';

/**
 * PrincipalRepositorySqlite implements PrincipalRepository by defining 
 * data access methods for principal objects
 */
export class PrincipalRepositorySqlite implements PrincipalRepository {
    dbHelper:           DBHelper;
    realmRepository:    RealmRepository;
    roleRepository:     RoleRepository;
    claimRepository:    ClaimRepository;
    sqlPrefix:string;

    constructor(theDBHelper: DBHelper, theRealmRepository: RealmRepository,
        theRoleRepository: RoleRepository, theClaimRepository: ClaimRepository) {
        this.dbHelper           = theDBHelper;
        this.realmRepository    = theRealmRepository;
        this.roleRepository     = theRoleRepository;
        this.claimRepository    = theClaimRepository;
        this.sqlPrefix          = 'SELECT rowid AS id, principal_name FROM principals';
    }

    rowToPrincipal(row: any): Promise<Principal> {
        return this.realmRepository.findById(row.realm_id).
            then(realm => {
                let principal = new PrincipalImpl(row.id, realm, row.principal_name);
                let promises = [this.claimRepository.loadPrincipalClaims(principal),
                                this.roleRepository.loadPrincipalRoles(principal)];
                return Promise.all(promises).
                    then(result => {
                    return principal;
                });
        });
    }

    /**
     * This method finds principal by id
     * @param {*} id - database id
     */
    findById(id: number): Promise<Principal> {
        return new Promise((resolve, reject) => {
            this.dbHelper.db.get(`${this.sqlPrefix} WHERE rowid == ?`, id, (err, row) => {
                if (err) {
                    reject(new PersistenceError(`Could not find principal with id ${id}`));
                } else {
                    this.rowToPrincipal(row).
                        then(principal => {
                        resolve(principal);
                    });
                }
            });
        });
    }

    /**
     * This method finds principal by name
     * @param {*} principalName
     */
    findByName(principalName: string): Promise<Principal> {
        return new Promise((resolve, reject) => {
            this.dbHelper.db.get(`${this.sqlPrefix} WHERE principal_name == ?`, principalName, (err, row) => {
                if (err) {
                    reject(new PersistenceError(`Could not find principal with name ${principalName}`));
                } else {
                    this.rowToPrincipal(row).
                        then(principal => {
                        resolve(principal);
                    });
                }
            });
        });
    }

    /**
     * This method saves object and returns updated object
     * @param {*} principal - to save
     */
    save(principal: Principal): Promise<Principal> {
        if (principal.id) {
            throw new PersistenceError(`Principal is immutable and cannot be updated ${String(principal)}`);
        } else {
            return new Promise((resolve, reject) => {
				let stmt = this.dbHelper.db.prepare('INSERT INTO principals VALUES (?)');
                stmt.run(principal.principalName);
                stmt.finalize(() => {
                    this.dbHelper.db.get('SELECT last_insert_rowid() AS lastID', (err, row) => {
                        principal.id = row.lastID;
                        resolve(principal);
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
        return new Promise((resolve, reject) => {
			this.dbHelper.db.run('DELETE FROM principals WHERE rowid = ?', id, (err) => {
				if (err) {
					reject(new PersistenceError(`Failed to remove principal ${id}`));
				} else {
					resolve(true);
				}
			});        
			this.dbHelper.db.run('DELETE FROM principals_claims WHERE principal_id = ?', id, (err) => {});
			this.dbHelper.db.run('DELETE FROM principals_roles WHERE principal_id = ?', id, (err) => {});        
		});
    }

    /**
     * This method queries database and returns list of objects
     */
    search(criteria: Map<string, any>, options?: QueryOptions): Promise<Array<Principal>> {
        let q:QueryHelper<Principal> = new QueryHelper(this.dbHelper.db);
        return q.query(this.sqlPrefix, criteria, (row) => {
             return this.rowToPrincipal(row);
         }, options);
    }
}
