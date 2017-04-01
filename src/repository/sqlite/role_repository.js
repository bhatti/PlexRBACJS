/*@flow*/
var sqlite3 = require('sqlite3').verbose();

import type {Principal}         from '../../domain/interface';
import type {Role}              from '../../domain/interface';
import type {ClaimRepository}    from '../interface';
import type {RoleRepository}    from '../interface';
import type {RealmRepository}   from '../interface';
import {QueryOptions}           from '../interface';
import {RoleImpl}               from '../../domain/role';
import {PersistenceError}       from '../persistence_error';

/**
 * RoleRepositorySqlite implements RoleRepository by defining data 
 * access methods for role objects
 */
export class RoleRepositorySqlie implements RoleRepository {
    db: sqlite3.Database;
    realmRepository: RealmRepository;
    claimRepository: ClaimRepository;
    sqlPrefix:string = 'SELECT rowid AS id, role_name, parent_id FROM roles';

    constructor(theDB: sqlite3.Database, theRealmRepository: RealmRepository, theClaimRepository: ClaimRepository) {
        this.db = theDB;
        this.realmRepository = theRealmRepository;
        this.claimRepository = theClaimRepository;
    }

    rowToRole(row: any): Role {
        const realm = this.realmRepository.findById(row.realm_id);
        let parent:?Role = null;
        if (row.parent_id != null && row.parent_id > 0) {
            parent = this.findById(row.parent_id);
        }
        let role = new RoleImpl(row.id, realm, row.role_name, row.parent);
        this.claimRepository.loadRoleClaims(role);
        return role;
    }

    /**
     * This method finds object by id
     * @param {*} id - database id
     */
    findById(id: number): Role {
        var role = null;
        //
        this.db.get('${this.sqlPrefix} WHERE rowid == ?', id, (err, row) => {
            return this.rowToRole(row);
        });
        throw new PersistenceError(`Could not find role with id ${id}`);
    }

    /**
     * This method saves object and returns updated object
     * @param {*} role - to save
     */
    save(role: Role): Role {
        if (role.id) {
            throw new PersistenceError(`Role is immutable and cannot be updated ${String(role)}`);
        } else {
            this.db.run('INSERT INTO roles VALUES (?)', role.roleName, function(err) {
                if (err) {
                    throw new PersistenceError(`Could not save role ${String(role)} due to ${err}`);
                } else {
                    role.id = this.lastID;
                }
            });
        }
        return role;
    }

    /**
     * This method adds role to principal
     * @param {*} principal
     * @param {*} role
     */
    addRoleToPrincipal(principal: Principal, role: Role): void {
        this.db.run('INSERT INTO principals_roles VALUES (?, ?)', 
            principal.id, role.id, function(err) {
                if (err) {
                    throw new PersistenceError(`Could not add Role ${String(role)} to principal ${String(principal)} due to ${err}`);
                }
            });
    }

    /**
     * This method removes role from principal
     * @param {*} principal
     * @param {*} role
     */
    removeRoleFromPrincipal(principal: Principal, role: Role): void {
        this.db.run('DELETE FROM principals_roles WHERE principal_id = ? and role_id = ?', principal.id, role.id, function(err) {});       
    }

    /**
     * This method removes object by id
     * @param {*} id - database id
     */
    removeById(id: number): boolean {
        let result:boolean = true;
        this.db.run('DELETE FROM roles WHERE rowid = ?', id, function(err) {
            if (err) {
                result = false;
            }
        });  
        this.db.run('DELETE FROM principals_roles WHERE role_id = ?', id, function(err) {});       
        return result;
    }

    /**
     * This method queries database and returns list of objects
     */
    search(criteria: Map<string, any>, options?: QueryOptions): Array<Role> {
         return this.db.query(this.sqlPrefix, (row) => {
             return this.rowToRole(row);
         });
    }

    /**
     * This method loads roles for given principal 
     */
    loadPrincipalRoles(principal: Principal)  {
        let criteria: Map<string, any> = new Map();
        criteria.set('principal_id', principal.id);

        let roles = this.db.query(
            'SELECT principal_id, role_id AS id, role_name ' +
            'FROM principals_roles INNER JOIN roles on roles.rowid = principals_roles.role_id', 
            criteria, null, (row) => {
            return this.rowToRole(row);
         });
        principal.roles = new Set(roles);
    }
}
