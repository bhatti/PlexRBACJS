
/* @flow Interface file */

import type {Principal}     from '../domain/interface';
import type {Claim}         from '../domain/interface';
import type {Realm}         from '../domain/interface';
import type {Role}          from '../domain/interface';
import {PersistenceError}   from './persistence_error';

/**
 * QueryOptions - used for optional query parameters
 */
export class QueryOptions {
    offset:    number       // starting offset
    limit:     number       // max rows to return
    page:      number       // page to return
    sortBy:    string       // sort order
    ascending: boolean      // whether to sort by ascending
    groupBy:   string       // optional group by
}

/**
 * Repository defines common data access methods
 */
export interface Repository<T> {
    /**
     * This method finds object by id
     * @param {*} id - database id
     */
    findById(id: number): T;

    /**
     * This method saves object and returns updated object
     * @param {*} object - to save
     */
    save(object: T): T;

    /**
     * This method removes object by id
     * @param {*} id - database id
     */
    removeById(id: number): boolean;

    /**
     * This method queries database and returns list of objects
     */
    search(criteria: Map<string, any>, options?: QueryOptions): Array<T>;
}

/**
 * RealmRepository defines data access methods for realm objects
 */
export interface RealmRepository extends Repository<Realm> {
    /**
     * This method finds object by id
     * @param {*} id - database id
     */
    findById(id: number): Realm; 

    /**
     * This method finds realm by name
     * @param {*} realmName
     */
    findByName(realmName: string): Realm; 

    /**
     * This method saves object and returns updated object
     * @param {*} realm - to save
     */
    save(realm: Realm): Realm; 

    /**
     * This method removes object by id
     * @param {*} id - database id
     */
    removeById(id: number): boolean; 

    /**
     * This method queries database and returns list of objects
     */
    search(criteria: Map<string, any>, options?: QueryOptions): Array<Realm>; 
}

/**
 * RoleRepository defines data access methods for role objects
 */
export interface RoleRepository extends Repository<Role> {
    /**
     * This method finds object by id
     * @param {*} id - database id
     */
    findById(id: number): Role; 

    /**
     * This method saves object and returns updated object
     * @param {*} role - to save
     */
    save(role: Role): Role; 

    /**
     * This method removes object by id
     * @param {*} id - database id
     */
    removeById(id: number): boolean; 

    /**
     * This method queries database and returns list of objects
     */
    search(criteria: Map<string, any>, options?: QueryOptions): Array<Role>; 

    /**
     * This method adds role to principal
     * @param {*} principal
     * @param {*} role
     */
    addRoleToPrincipal(principal: Principal, role: Role): void; 

    /**
     * This method removes role from principal
     * @param {*} principal
     * @param {*} role
     */
    removeRoleFromPrincipal(principal: Principal, role: Role): void;

    /**
     * This method loads roles for principal 
     */
    loadPrincipalRoles(principal: Principal): void; 
}

/**
 * ClaimRepository defines data access methods for Claim objects
 */
export interface ClaimRepository extends Repository<Claim> {
    /**
     * This method finds object by id
     * @param {*} id - database id
     */
    findById(id: number): Claim; 

    /**
     * This method saves object and returns updated object
     * @param {*} Claim - to save
     */
    save(claim: Claim): Claim; 

    /**
     * This method removes object by id
     * @param {*} id - database id
     */
    removeById(id: number): boolean; 

    /**
     * This method queries database and returns list of objects
     */
    search(criteria: Map<string, any>, options?: QueryOptions): Array<Claim>; 

    /**
     * This method adds claims to principal
     */
    addClaimToPrincipal(principal: Principal, claim: Claim): void; 

    /**
     * This method adds claims to role
     */
    addClaimToRole(role: Role, claim: Claim): void; 

   /**
     * This method removes claims from principal
     */
    removeClaimFromPrincipal(principal: Principal, claim: Claim):void; 

    /**
     * This method remove claims from role
     */
    removeClaimFromRole(role: Role, claim: Claim): void; 

    /**
     * This method loads claims for given principal using claims associated with role and principal
     */
    loadPrincipalClaims(principal: Principal): void;

    /**
     * This method load claims for role
     */
    loadRoleClaims(role: Role): void; 
}

/**
 * PrincipalRepository defines data access methods for principal objects
 */
export interface PrincipalRepository extends Repository<Principal> {
    /**
     * This method finds object by id
     * @param {*} id - database id
     */
    findById(id: number): Principal; 

    /**
     * This method finds principal by name
     * @param {*} principalName
     */
    findByName(principalName: string): Principal; 

    /**
     * This method saves object and returns updated object
     * @param {*} principal - to save
     */
    save(principal: Principal): Principal; 

    /**
     * This method removes object by id
     * @param {*} id - database id
     */
    removeById(id: number): boolean; 

    /**
     * This method queries database and returns list of objects
     */
    search(criteria: Map<string, any>, options?: QueryOptions): Array<Principal>; 
}