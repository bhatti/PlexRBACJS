/*@flow*/

const assert = require('assert');

import type {Principal}         from '../../domain/interface';
import type {Realm}             from '../../domain/interface';
import type {Role}              from '../../domain/interface';
import type {ClaimRepository}   from '../interface';
import type {RoleRepository}    from '../interface';
import type {RealmRepository}   from '../interface';
import {QueryOptions}           from '../interface';
import {RoleImpl}               from '../../domain/role';
import {PersistenceError}       from '../persistence_error';
import {DBHelper}               from './db_helper';
import {QueryHelper}            from './query_helper';
import type {SecurityCache}     from '../../cache/interface';

/**
 * RoleRepositorySqlite implements RoleRepository by defining data
 * access methods for role objects
 */
export class RoleRepositorySqlite implements RoleRepository {
    dbHelper:           DBHelper;
    realmRepository:    RealmRepository;
    claimRepository:    ClaimRepository;
    cache:              SecurityCache;
    sqlPrefix:string;

    constructor(theDBHelper: DBHelper,
        theRealmRepository: RealmRepository,
        theClaimRepository: ClaimRepository,
        theCache: SecurityCache) {
        //
        assert(theDBHelper, 'db-helper not specified');
        assert(theRealmRepository, 'realm-repository not specified');
        assert(theClaimRepository, 'claim-repository not specified');
        assert(theCache, 'cache not specified');
        //
        this.dbHelper           = theDBHelper;
        this.realmRepository    = theRealmRepository;
        this.claimRepository    = theClaimRepository;
        this.cache              = theCache;
        this.sqlPrefix          = 'SELECT rowid AS id, realm_id, role_name FROM roles';
    }

    /**
     * This method finds object by id
     * @param {*} id - database id
     */
    findById(id: number): Promise<Role> {
        if (!id) {
            return Promise.reject(new PersistenceError('role-id not specified'));
        }
        let cached = this.cache.get('role', `id_${id}`);
        if (cached) {
            return Promise.resolve(cached);
        }
        //
        return new Promise((resolve, reject) => {
            this.dbHelper.db.get(`${this.sqlPrefix} WHERE rowid == ?`, id, (err, row) => {
                if (err) {
                    reject(new PersistenceError(`Could not find role with id ${id}`));
                } else if (row) {
                    return this.__rowToRole(row).
                    then(role => {
                        resolve(role);
                    }).catch(err => {
                        reject(err);
                    });
                } else {
                    reject(new PersistenceError(`Could not find role with id ${id}`));
                }
            });
        });
    }

    /**
     * This method finds role by name
     * @param {*} realmName
     * @param {*} roleName
     */
    findByName(realmName: string, roleName: string): Promise<Role> {
        if (!realmName) {
            return Promise.reject(new PersistenceError('realmName not specified'));
        }
        if (!roleName) {
            return Promise.reject(new PersistenceError('roleName not specified'));
        }
        //
        let db = this.dbHelper.db;
        return new Promise((resolve, reject) => {
            this.realmRepository.findByName(realmName).
            then(realm => {
                db.get(`${this.sqlPrefix} WHERE realm_id = ? AND role_name == ?`, realm.id, roleName, (err, row) => {
                    if (err) {
                        reject(new PersistenceError(`Could not find role with name ${roleName}`));
                    } else if (row) {
                        this.__rowToRole(row).
                        then(role => {
                            resolve(role);
                        }).catch(err => {
                            reject(err);
                        });
                    } else {
                        reject(new PersistenceError(`Could not find role with name ${roleName}`));
                    }
                });
            }).catch(err => {
                reject(err);
            });
        });
    }

    /**
     * This method saves object and returns updated object
     * @param {*} role - to save
     */
    save(role: Role): Promise<Role> {
        if (!role) {
            return Promise.reject(new PersistenceError('role not specified'));
        }
        if (!role.realm || !role.realm.id) {
            return Promise.reject(new PersistenceError('realm.id not specified'));
        }
        if (role.id) {
            throw new PersistenceError(`Role is immutable and cannot be updated ${String(role)}`);
        } else {
            return new Promise((resolve, reject) => {
                this.dbHelper.db.serialize(() => {
                    let stmt = this.dbHelper.db.prepare('INSERT INTO roles VALUES (?, ?)');
                    stmt.run(role.realm.id, role.roleName);
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
            });
        }
    }

   /**
     * This method adds set of roles as parent
     */
    addParentsToRole(role: Role, parents: Set<Role>): Promise<Role> {
        if (!role) {
            return Promise.reject(new PersistenceError('role not specified'));
        }
        if (!parents) {
            return Promise.reject(new PersistenceError('parents not specified'));
        }
        this.cache.remove('role', `id_${role.id}`);
        parents.forEach(p => {
            role.parents.add(p);
            })
        let insertPromises = [];
        parents.forEach(parent => {
            if (parent.id != role.id) {
                insertPromises.push(new Promise((resolve, reject) => {
                    this.dbHelper.db.run('INSERT INTO role_parents VALUES(?, ?) ',
                    role.id, parent.id, (err) => {
                        if (err) {
                            reject(new PersistenceError(`Failed to add parent ${String(parent)} to ${String(role)} due to ${err}`));
                        } else {
                            resolve(role);
                        }
                    });
                }));
            } else {
                insertPromises.push(Promise.reject(new PersistenceError(
                    `!!!Cannot add same role as parent ${String(parent)}-${parent.id} to ${String(role)}--${role.id}`)));
            }
        });
        return Promise.all(insertPromises).
        then(loaded => {
            return role;
        });
    }

    /**
     * This method remove set of roles as parent
     */
    removeParentsFromRole(role: Role, parents: Set<Role>): Promise<Role> {
        if (!role) {
            return Promise.reject(new PersistenceError('role not specified'));
        }
        if (!parents) {
            return Promise.reject(new PersistenceError('parents not specified'));
        }
        this.cache.remove('role', `id_${role.id}`);
        let parentIds = '';
        parents.forEach(parent => {
            if (parentIds.length > 0) {
                parentIds += ',';
            }
            parentIds += String(parent.id);
        });
        return new Promise((resolve, reject) => {
            this.dbHelper.db.run('DELETE FROM role_parents WHERE role_id = ? AND parent_role_id in (?) ',
            role.id, parentIds, (err) => {
                    if (err) {
                        reject(new PersistenceError(`Failed to remove parent ${String(parent)} from ${String(role)} due to ${err}`));
                    } else {
                        resolve(role);
                    }
            });
        }).then(loaded => {
            parents.forEach(parent => {
                role.parents.delete(parent);
            })
            return role;
        });
    }

    /**
     * This method adds role to principal
     * @param {*} principal
     * @param {*} roles
     */
    addRolesToPrincipal(principal: Principal, roles: Set<Role>): Promise<*> {
        if (!principal) {
            return Promise.reject(new PersistenceError('principal not specified'));
        }
        if (!roles) {
            return Promise.reject(new PersistenceError('roles not specified'));
        }
        let promises = [];
        roles.forEach(role => {
          this.cache.remove('role', `id_${role.id}`);
          promises.push(new Promise((resolve, reject) => {
              this.dbHelper.db.run('INSERT INTO principals_roles VALUES (?, ?)',
                  principal.id, role.id, (err) => {
                      if (err) {
                          reject(new PersistenceError(`Could not add Role ${String(role)} to principal ${String(principal)} due to ${err}`));
                      } else {
                          principal.roles.add(role);
                          resolve();
                      }
                  });
          }));
        });
        return Promise.all(promises);
    }

    /**
     * This method removes role from principal
     * @param {*} principal
     * @param {*} role
     */
    removeRolesFromPrincipal(principal: Principal, roles: Set<Role>): Promise<*> {
        if (!principal) {
            return Promise.reject(new PersistenceError('principal not specified'));
        }
        if (!roles) {
            return Promise.reject(new PersistenceError('roles not specified'));
        }
        let promises = [];
        roles.forEach(role => {
          this.cache.remove('role', `id_${role.id}`);
          promises.push(new Promise((resolve, reject) => {
              this.dbHelper.db.run('DELETE FROM principals_roles WHERE principal_id = ? and role_id = ?', principal.id, role.id, (err) => {
                      if (err) {
                          reject(new PersistenceError(`Could not remove Role ${String(role)} from principal ${String(principal)} due to ${err}`));
                      } else {
                          principal.roles.delete(role);
                          resolve();
                      }
                  });
          }));
        });
        return Promise.all(promises);
    }

    /**
     * This method removes object by id
     * @param {*} id - database id
     */
    removeById(id: number): Promise<boolean> {
        if (!id) {
            return Promise.reject(new PersistenceError('id not specified'));
        }
        this.cache.remove('role', `id_${id}`);
        return new Promise((resolve, reject) => {
            this.dbHelper.db.run('DELETE FROM roles WHERE rowid = ?', id, (err) => {
                if (err) {
                    reject(new PersistenceError(`Failed to remove role with id ${id} due to ${err}`));
                } else {
                    this.cache.remove('role', `id_${id}`);
                    resolve(true);
                }
            });
            this.dbHelper.db.run('DELETE FROM principals_roles WHERE role_id = ?', id, (err) => {});
            this.dbHelper.db.run('DELETE FROM role_parents WHERE role_id = ?', id, (err) => {});
        });
    }

    /**
     * This method queries database and returns list of objects
     */
    search(criteria: Map<string, any>, options?: QueryOptions): Promise<Array<Role>> {
        let q:QueryHelper<Role> = new QueryHelper(this.dbHelper.db);
        return q.query(this.sqlPrefix, criteria, (row) => {
             return this.__rowToRole(row);
         }, options);
    }

    /**
     * This method loads roles for given principal
     */
    loadPrincipalRoles(principal: Principal): Promise<void> {
        if (!principal) {
            return Promise.reject(new PersistenceError('principal not specified'));
        }
        let criteria: Map<string, any> = new Map();
        criteria.set('principal_id', principal.id);
        let q:QueryHelper<Role> = new QueryHelper(this.dbHelper.db);
        return q.query(
                'SELECT principal_id, role_id, roles.rowid AS id, role_name, realm_id ' +
                'FROM principals_roles INNER JOIN roles on roles.rowid = principals_roles.role_id',
                criteria, (row) => {
                return this.__rowToRole(row).
                    then(role => {
                    principal.roles.add(role);
				    return role;
                });
        });
    }


     // This method loads parent roles
    _loadParentRoles(role: Role): Promise<Array<Role>> {
        if (!role || !role.id) {
            return Promise.reject(new PersistenceError('role not specified'));
        }
        //
        let criteria: Map<string, any> = new Map();
        criteria.set('role_id', role.id);
        let q:QueryHelper<Role> = new QueryHelper(this.dbHelper.db);
        //
        return q.query(
                'SELECT parent_role_id, role_id, roles.rowid AS id, role_name, realm_id ' +
                'FROM role_parents INNER JOIN roles on roles.rowid = role_parents.parent_role_id',
                criteria, (row) => {
                return this.__rowToRole(row).
                    then(parent => {
                        role.parents.add(parent);
				    return parent;
                });
        });
    }

    __rowToRole(row: any): Promise<Role> {
        //
        return new Promise((resolve, reject) => {
            this.realmRepository.findById(row.realm_id).
                then(realm => {
                    let role = new RoleImpl(row.id, realm, row.role_name);
                    let promiseLoadParents = this._loadParentRoles(role);
                    let promiseLoadClaims = this.claimRepository.loadRoleClaims(role);
                    Promise.all([promiseLoadParents, promiseLoadClaims]).
                    then(result => {
                        this.cache.set('role', `id_${role.id}`, role);
                        resolve(role);
                    }).catch(err => {
                        reject(err);
                    });
            });
        });
        //
    }

}
