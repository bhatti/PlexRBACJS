/*@flow*/

import type {Principal}         from '../../domain/interface';
import type {Role}              from '../../domain/interface';
import type {ClaimRepository}    from '../interface';
import type {RoleRepository}    from '../interface';
import type {RealmRepository}   from '../interface';
import {QueryOptions}           from '../interface';
import {RoleImpl}               from '../../domain/role';
import {PersistenceError}       from '../persistence_error';
import {DBHelper}               from './db_helper';
import {QueryHelper}            from './query_helper';

/**
 * RoleRepositorySqlite implements RoleRepository by defining data 
 * access methods for role objects
 */
export class RoleRepositorySqlie implements RoleRepository {
    dbHelper:           DBHelper;
    realmRepository:    RealmRepository;
    claimRepository:    ClaimRepository;
    sqlPrefix:string;

    constructor(theDBHelper: DBHelper, theRealmRepository: RealmRepository, theClaimRepository: ClaimRepository) {
        this.dbHelper           = theDBHelper;
        this.realmRepository    = theRealmRepository;
        this.claimRepository    = theClaimRepository;
        this.sqlPrefix          = 'SELECT rowid AS id, role_name FROM roles';
    }

    rowToRole(row: any): Promise<Role> {
        //
        return new Promise((resolve, reject) => {
            this.realmRepository.findById(row.realm_id).
                then(realm => {
                    let role = new RoleImpl(row.id, realm, row.role_name);
                    let promiseLoadParents = this._loadParentRoles(row.id).
                        then(roles => {
                            role.parents = new Set(roles);
                        });
                    let promiseLoadClaims = this.claimRepository.loadRoleClaims(role);
                    Promise.all([promiseLoadParents, promiseLoadClaims]).
                    then(result => {
                        resolve(role);
                    }).catch(err => {
                        reject(err);
                    });
            });
        });
        //     
    }

    /**
     * This method finds object by id
     * @param {*} id - database id
     */
    findById(id: number): Promise<Role> {
        //
        return new Promise((resolve, reject) => {
            this.dbHelper.db.get(`${this.sqlPrefix} WHERE rowid == ?`, id, (err, row) => {
                if (err) {
                    reject(new PersistenceError(`Could not find role with id ${id}`));
                } else if (row) {
                    return this.rowToRole(row).
                        then(role => {
                        resolve(role);
                    });
                } else {
                    reject(new PersistenceError(`Could not find role with id ${id}`));
                }
            });
        });
    }

    /**
     * This method saves object and returns updated object
     * @param {*} role - to save
     */
    save(role: Role): Promise<Role> {
        if (role.id) {
            throw new PersistenceError(`Role is immutable and cannot be updated ${String(role)}`);
        } else {
            return new Promise((resolve, reject) => {
                let stmt = this.dbHelper.db.prepare('INSERT INTO roles VALUES (?)');
                stmt.run(role.roleName);
                stmt.finalize((err) => {
                    if (err) {
                       reject(new PersistenceError(`Could not add ${String(role)} due to ${err}`));
                    }
                    this.dbHelper.db.get('SELECT last_insert_rowid() AS lastID', (err, row) => {
                        role.id = row.lastID;
                        if (err) {
                            reject(new PersistenceError(`Could not add ${String(role)} due to ${err}`));
                        } else {
                            resolve(role);
                        }
                    });
                });
            });
        }
    }

    /**
     * This method adds role to principal
     * @param {*} principal
     * @param {*} role
     */
    addRoleToPrincipal(principal: Principal, role: Role): Promise<void> {
        return new Promise((resolve, reject) => {
            this.dbHelper.db.run('INSERT INTO principals_roles VALUES (?, ?)', 
                principal.id, role.id, (err) => {
                    if (err) {
                        reject(new PersistenceError(`Could not add Role ${String(role)} to principal ${String(principal)} due to ${err}`));
                    } else {
                        resolve();
                    }
                });
        });
    }

    /**
     * This method removes role from principal
     * @param {*} principal
     * @param {*} role
     */
    removeRoleFromPrincipal(principal: Principal, role: Role): Promise<void> {
        return new Promise((resolve, reject) => {
            this.dbHelper.db.run('DELETE FROM principals_roles WHERE principal_id = ? and role_id = ?', principal.id, role.id, (err) => {
                    if (err) {
                        reject(new PersistenceError(`Could not remove Role ${String(role)} from principal ${String(principal)} due to ${err}`));
                    } else {
                        resolve();
                    }
                });
        });
    }

    /**
     * This method removes object by id
     * @param {*} id - database id
     */
    removeById(id: number): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this.dbHelper.db.run('DELETE FROM roles WHERE rowid = ?', id, function(err) {
                if (err) {
                    reject(new PersistenceError(`Failed to remove role with id ${id} due to ${err}`));
                } else {
                    resolve(true);
                }
            });  
            this.dbHelper.db.run('DELETE FROM principals_roles WHERE role_id = ?', id, function(err) {});
            this.dbHelper.db.run('DELETE FROM role_parents WHERE role_id = ?', id, function(err) {});
        });
    }

    /**
     * This method queries database and returns list of objects
     */
    search(criteria: Map<string, any>, options?: QueryOptions): Promise<Array<Role>> {
        let q:QueryHelper<Role> = new QueryHelper(this.dbHelper.db);
        return q.query(this.sqlPrefix, criteria, (row) => {
             return this.rowToRole(row);
         }, options);
    }

    /**
     * This method loads roles for given principal 
     */
    loadPrincipalRoles(principal: Principal): Promise<void> {
        let criteria: Map<string, any> = new Map();
        criteria.set('principal_id', principal.id);
        let q:QueryHelper<Role> = new QueryHelper(this.dbHelper.db);
        return q.query(
                'SELECT principal_id, role_id AS id, role_name ' +
                'FROM principals_roles INNER JOIN roles on roles.rowid = principals_roles.role_id', 
                criteria, (row) => {
                return this.rowToRole(row).
                    then(role => {
                    principal.roles.add(role);
				    return role;
                });
        });
    }

     // This method loads parent roles 
    _loadParentRoles(roleId: number): Promise<void> {
        let criteria: Map<string, any> = new Map();
        criteria.set('role_id', roleId);
        let q:QueryHelper<Role> = new QueryHelper(this.dbHelper.db);
        return q.query(
                'SELECT parent_role_id, role_id AS id, role_name ' +
                'FROM principals_roles INNER JOIN roles on roles.rowid = principals_roles.role_id', 
                criteria, (row) => {
                return this.rowToRole(row).
                    then(role => {
				    return role;
                });
        });
    }
}
