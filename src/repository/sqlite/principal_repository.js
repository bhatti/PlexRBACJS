/*@flow*/
var sqlite3 = require('sqlite3').verbose();

import type {Principal}             from '../../domain/interface';
import type {PrincipalRepository}   from '../interface';
import type {RoleRepository}        from '../interface';
import type {RealmRepository}       from '../interface';
import type {ClaimRepository}       from '../interface';
import {QueryOptions}               from '../interface';
import {PrincipalImpl}              from '../../domain/principal';
import {PersistenceError}           from '../persistence_error';

/**
 * PrincipalRepositorySqlite implements PrincipalRepository by defining 
 * data access methods for principal objects
 */
export class PrincipalRepositorySqlite implements PrincipalRepository {
    db: sqlite3.Database;
    realmRepository: RealmRepository;
    roleRepository: RoleRepository;
    claimRepository: ClaimRepository;
    sqlPrefix:string = 'SELECT rowid AS id, principal_name FROM principals';

    constructor(theDB: sqlite3.Database, theRealmRepository: RealmRepository,
        theRoleRepository: RoleRepository, theClaimRepository: ClaimRepository) {
        this.db = theDB;
        this.realmRepository = theRealmRepository;
        this.roleRepository = theRoleRepository;
        this.claimRepository = theClaimRepository;
    }

    rowToPrincipal(row: any): Principal {
        const realm = this.realmRepository.findById(row.realm_id);
        let principal = new PrincipalImpl(row.id, realm, row.principal_name);
        this.claimRepository.loadPrincipalClaims(principal);
        this.roleRepository.loadPrincipalRoles(principal);
        return principal;
    }

    /**
     * This method finds principal by id
     * @param {*} id - database id
     */
    findById(id: number): Principal {
        var principal = null;
        //
        this.db.get('${this.sqlPrefix} WHERE rowid == ?', id, (err, row) => {
            return this.rowToPrincipal(row);
        });
        throw new PersistenceError(`Could not find principal with id ${id}`);
    }

    /**
     * This method finds principal by name
     * @param {*} principalName
     */
    findByName(principalName: string): Principal {
        var principal = null;
        //
        this.db.get('${this.sqlPrefix} WHERE principal_name == ?', principalName, (err, row) => {
            return this.rowToPrincipal(row);
        });
        throw new PersistenceError(`Could not find principal with name ${principalName}`);
    }

    /**
     * This method saves object and returns updated object
     * @param {*} principal - to save
     */
    save(principal: Principal): Principal {
        if (principal.id) {
            throw new PersistenceError(`Principal is immutable and cannot be updated ${String(principal)}`);
        } else {
            this.db.run('INSERT INTO principals VALUES (?)', principal.principalName, function(err) {
                if (err) {
                    throw new PersistenceError(`Could not save principal ${String(principal)} due to ${err}`);
                } else {
                    principal.id = this.lastID;
                }
            });
        }
        return principal;
    }

    /**
     * This method removes object by id
     * @param {*} id - database id
     */
    removeById(id: number): boolean {
        let result:boolean = true;
        this.db.run('DELETE FROM principals WHERE rowid = ?', id, function(err) {
            if (err) {
                result = false;
            }
        });        
        this.db.run('DELETE FROM principals_claims WHERE principal_id = ?', id, function(err) {});        
        this.db.run('DELETE FROM principals_roles WHERE principal_id = ?', id, function(err) {});        
        return result;
    }

    /**
     * This method queries database and returns list of objects
     */
    search(criteria: Map<string, any>, options?: QueryOptions): Array<Principal> {
         return this.db.query(this.sqlPrefix, (row) => {
             return this.rowToPrincipal(row);
         });
    }
}
