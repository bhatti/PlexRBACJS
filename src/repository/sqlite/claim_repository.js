/*@flow*/
var sqlite3 = require('sqlite3').verbose();

import type {Claim}             from '../../domain/interface';
import type {Principal}         from '../../domain/interface';
import type {Role}              from '../../domain/interface';
import type {ClaimRepository}   from '../interface';
import type {RealmRepository}   from '../interface';
import  {QueryOptions}          from '../interface';
import {ClaimImpl}              from '../../domain/Claim';
import {PersistenceError}       from '../persistence_error';

/**
 * ClaimRepositorySqlite implements ClaimRepository by defining data access methods for Claim objects
 */
export class ClaimRepositorySqlite implements ClaimRepository {
    db: sqlite3.Database;
    realmRepository: RealmRepository;
    sqlPrefix:string = 'SELECT rowid AS id, realm_id, action, resource, condition FROM claims';


    constructor(theDB: sqlite3.Database, theRealmRepository: RealmRepository) {
        this.db = theDB;
        this.realmRepository = theRealmRepository;
    }

    rowToClaim(row: any): Claim {
        const realm = this.realmRepository.findById(row.realm_id);
        return new ClaimImpl(row.id, realm, row.action, row.resource, row.condition);
    }

    /**
     * This method finds object by id
     * @param {*} id - database id
     */
    findById(id: number): Claim {
        var Claim = null;
        //
        this.db.get('${this.sqlPrefix} WHERE rowid == ?', id, (err, row) => {
            return this.rowToClaim(row);
        });
        throw new PersistenceError(`Could not find Claim with id ${id}`);
    }

    /**
     * This method saves object and returns updated object
     * @param {*} Claim - to save
     */
    save(claim: Claim): Claim {
        if (claim.id) {
            this.db.run('UPDATE claims SET action = ?, resource = ?, condition = ?', 
            claim.action, claim.resource, claim.resource, function(err, rows) {
                if (err) {
                    throw new PersistenceError(`Could not save Claim ${String(claim)} due to ${err}`);
                }
            });
        } else {
            this.db.run('INSERT INTO claims VALUES (?, ?, ?, ?)', 
            claim.realm.id, claim.action, claim.resource, claim.condition, function(err) {
                if (err) {
                    throw new PersistenceError(`Could not save Claim ${String(claim)} due to ${err}`);
                } else {
                    claim.id = this.lastID;
                }
            });
        }
        return claim;
    }

    /**
     * This method removes object by id
     * @param {*} id - database id
     */
    removeById(id: number): boolean {
        let result:boolean = true;
        this.db.run('DELETE FROM claims WHERE rowid = ?', id, function(err) {
            if (err) {
                result = false;
            }
        });
        this.db.run('DELETE FROM principals_claims WHERE claim_id = ?', id, function(err) {});        
        return result;
    }

    /**
     * This method queries database and returns list of objects
     */
    search(criteria: Map<string, any>, options?: QueryOptions): Array<Claim> {
         return this.db.query(this.sqlPrefix, criteria, options, (row) => {
            return this.rowToClaim(row);
         });
    }

    /**
     * This method adds claims to principal
     */
    addClaimToPrincipal(principal: Principal, claim: Claim) {
        this.db.run('INSERT INTO principals_claims VALUES (?, ?)', 
            principal.id, claim.id, function(err) {
                if (err) {
                    throw new PersistenceError(`Could not add Claim ${String(claim)} to principal ${String(principal)} due to ${err}`);
                }
            });
        principal.claims.add(claim);
    }

    /**
     * This method adds claims to role
     */
    addClaimToRole(role: Role, claim: Claim) {
        this.db.run('INSERT INTO roles_claims VALUES (?, ?)', 
            role.id, claim.id, function(err) {
                if (err) {
                    throw new PersistenceError(`Could not add Claim ${String(claim)} to role ${String(role)} due to ${err}`);
                }
            });
        role.claims.add(claim);
    }


    /**
     * This method removes claims from principal
     */
    removeClaimFromPrincipal(principal: Principal, claim: Claim) {
        this.db.run('DELETE FROM principals_claims WHERE principal_id = ? and claim_id = ?', principal.id, claim.id, function(err) {});
        principal.claims.delete(claim);
    }

    /**
     * This method remove claims from role
     */
    removeClaimFromRole(role: Role, claim: Claim) {
        this.db.run('DELETE FROM roles_claims WHERE role_id = ? and claim_id = ?', role.id, claim.id, function(err) {});
        role.claims.delete(claim);
    }

    /**
     * This method returns claims by principal that are associated to principal roles or directly to principal
     */
    loadPrincipalClaims(principal: Principal) {
        let criteria: Map<string, any> = new Map();
        criteria.set('principal_id', principal.id);

        let principalClaims = this.db.query(
            'SELECT principal_id, claim_id AS id, realm_id, action, resource, condition ' +
            'FROM principals_claims INNER JOIN claims on claims.rowid = principals_claims.claim_id', 
            criteria, null, (row) => {
            return this.rowToClaim(row);
         });
         principalClaims.forEach(claim => {
             principal.claims.add(claim);
         });
    }

    /**
     * This method load claims for role
     */
    loadRoleClaims(role: Role)  {
        let criteria: Map<string, any> = new Map();
        criteria.set('role_id', role.id);

        role.claims = this.db.query(
            'SELECT role_id, claim_id AS id, realm_id, action, resource, condition ' +
            'FROM roles_claims INNER JOIN claims on claims.rowid = roles_claims.claim_id', 
            criteria, null, (row) => {
            return this.rowToClaim(row);
         });
    }    
}