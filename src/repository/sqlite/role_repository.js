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
    async findById(id: number): Promise<Role> {
        assert(id, 'role-id not specified');

        let cached = this.cache.get('role', `id_${id}`);
        if (cached) {
            return cached;
        }
        //
        return new Promise((resolve, reject) => {
            this.dbHelper.db.get(`${this.sqlPrefix} WHERE rowid == ?`, id, (err, row) => {
                if (err) {
                    reject(new PersistenceError(`Could not find role with id ${id}`));
                } else if (row) {
                    this.__rowToRole(row).then(role => {
                        resolve(role);
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
    async findByName(realmName: string, roleName: string): Promise<Role> {
        assert(realmName, 'realm-name not specified');
        assert(roleName, 'role-name not specified');

        //
        let realm   = await this.realmRepository.findByName(realmName);
        return new Promise((resolve, reject) => {
                this.dbHelper.db.get(`${this.sqlPrefix} WHERE realm_id = ? AND role_name == ?`,
                                      realm.id, roleName, (err, row) => {
                    if (err) {
                        reject(new PersistenceError(`Could not find role with name ${roleName}`));
                    } else if (row) {
                        this.__rowToRole(row).
                        then(role => {
                            resolve(role);
                        });
                    } else {
                        reject(new PersistenceError(`Could not find role with name ${roleName}`));
                    }
                });
            });
    }

    /**
     * This method saves object and returns updated object
     * @param {*} role - to save
     */
    async save(role: Role): Promise<Role> {
        assert(role, 'role not specified');
        assert(role.realm && role.realm.id, 'realm not specified');

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
    async addParentsToRole(role: Role, parents: Set<Role>): Promise<Role> {
        assert(role, 'role not specified');
        assert(parents, 'role parents not specified');

        this.cache.remove('role', `id_${role.id}`);
        parents.forEach(p => role.parents.add(p))
        //
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
            }
        });
        await Promise.all(insertPromises);
        return role;
    }

    /**
     * This method remove set of roles as parent
     */
    async removeParentsFromRole(role: Role, parents: Set<Role>): Promise<Role> {
        assert(role, 'role not specified');
        assert(parents, 'role parents not specified');
        //
        this.cache.remove('role', `id_${role.id}`);
        parents.forEach(parent => role.parents.delete(parent));
        //
        let parentIds = '';
        parents.forEach(parent => {
            if (parentIds.length > 0) {
                parentIds += ',';
            }
            parentIds += String(parent.id);
        });
        await new Promise((resolve, reject) => {
            this.dbHelper.db.run('DELETE FROM role_parents WHERE role_id = ? AND parent_role_id in (?) ',
            role.id, parentIds, (err) => {
                    if (err) {
                        reject(new PersistenceError(`Failed to remove parent ${String(parent)} from ${String(role)} due to ${err}`));
                    } else {
                        resolve(role);
                    }
            });
        });
        return role;
    }

    /**
     * This method adds role to principal
     * @param {*} principal
     * @param {*} roles
     */
    async addRolesToPrincipal(principal: Principal, roles: Set<Role>): Promise<Principal> {
        assert(principal, 'principal not specified');
        assert(roles, 'roles not specified');
        //
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
                          resolve(role);
                      }
                  });
            }));
        });
        await Promise.all(promises);
        return principal;
    }

    /**
     * This method removes role from principal
     * @param {*} principal
     * @param {*} role
     */
    async removeRolesFromPrincipal(principal: Principal, roles: Set<Role>): Promise<Principal> {
        assert(principal, 'principal not specified');
        assert(roles, 'roles not specified');
        //
        let promises = [];
        roles.forEach(role => {
            this.cache.remove('role', `id_${role.id}`);
            promises.push(new Promise((resolve, reject) => {
              this.dbHelper.db.run('DELETE FROM principals_roles WHERE principal_id = ? and role_id = ?', principal.id, role.id, (err) => {
                      if (err) {
                          reject(new PersistenceError(`Could not remove Role ${String(role)} from principal ${String(principal)} due to ${err}`));
                      } else {
                          principal.roles.delete(role);
                          resolve(role);
                      }
                  });
            }));
        });
        await Promise.all(promises);
        return principal;
    }

    /**
     * This method removes object by id
     * @param {*} id - database id
     */
    async removeById(id: number): Promise<boolean> {
        assert(id, 'role id not specified');
        //
        this.cache.remove('role', `id_${id}`);
        let promise = new Promise((resolve, reject) => {
            this.dbHelper.db.run('DELETE FROM principals_roles WHERE role_id = ?', id, (err) => {});
            this.dbHelper.db.run('DELETE FROM role_parents WHERE role_id = ?', id, (err) => {});
            this.dbHelper.db.run('DELETE FROM roles WHERE rowid = ?', id, (err) => {
                if (err) {
                    reject(new PersistenceError(`Failed to remove role with id ${id} due to ${err}`));
                } else {
                    this.cache.remove('role', `id_${id}`);
                    resolve(true);
                }
            });
        });
        return await promise;
    }

    /**
     * This method queries database and returns list of objects
     */
    async search(criteria: Map<string, any>, options?: QueryOptions): Promise<Array<Role>> {
        let q:QueryHelper<Role> = new QueryHelper(this.dbHelper.db);
        return q.query(this.sqlPrefix, criteria, (row) => {
             return this.__rowToRole(row);
         }, options);
    }

    /**
     * This method loads roles for given principal
     */
    async loadPrincipalRoles(principal: Principal): Promise<Principal> {
        assert(principal, 'principal not specified');
        //
        principal.roles.clear();
        let criteria: Map<string, any> = new Map();
        criteria.set('principal_id', principal.id);
        let q:QueryHelper<Role> = new QueryHelper(this.dbHelper.db);
        let claimPromises = [];

        claimPromises.push(q.query(
                    'SELECT principal_id, role_id, roles.rowid AS id, role_name, realm_id ' +
                    'FROM principals_roles INNER JOIN roles on roles.rowid = principals_roles.role_id',
                    criteria, (row) => {
                    return this.__rowToRole(row).
                        then(role => {
                        principal.roles.add(role);
    				    return role;
                    });
        }));
        principal.roles.forEach(role => {
            claimPromises.push(this.claimRepository.loadRoleClaims(role));
        });
        await Promise.all(claimPromises);
        return principal;
    }


     // This method loads parent roles
    async _loadParentRoles(role: Role): Promise<Array<Role>> {
        assert(role && role.id, 'role not specified');
        //
        let criteria: Map<string, any> = new Map();
        criteria.set('role_id', role.id);
        let q:QueryHelper<Role> = new QueryHelper(this.dbHelper.db);
        //
        return q.query(
                'SELECT parent_role_id, role_id, roles.rowid AS id, role_name, realm_id ' +
                'FROM role_parents INNER JOIN roles on roles.rowid = role_parents.parent_role_id',
                criteria, (row) => {
                return this.__rowToRole(row).then(parent => {
                        role.parents.add(parent);
				                return parent;
                });
        });
    }

    async __rowToRole(row: any): Promise<Role> {
        //
        let realm               = await this.realmRepository.findById(row.realm_id);
        let role                = new RoleImpl(row.id, realm, row.role_name);
        let promiseLoadParents  = await this._loadParentRoles(role);
        let promiseLoadClaims   = await this.claimRepository.loadRoleClaims(role);
        this.cache.set('role', `id_${role.id}`, role);
        return role;
    }
}
