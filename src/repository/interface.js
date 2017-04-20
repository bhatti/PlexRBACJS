
/* @flow Interface file */

import type {IPrincipal}    from '../domain/interface';
import type {IClaim}        from '../domain/interface';
import type {IRealm}        from '../domain/interface';
import type {IRole}         from '../domain/interface';
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
    findById(id: number): Promise<T>;

    /**
     * This method saves object and returns updated object
     * @param {*} object - to save
     */
    save(object: T): Promise<T>;

    /**
     * This method removes object by id
     * @param {*} id - database id
     */
    removeById(id: number): Promise<boolean>;

    /**
     * This method queries database and returns list of objects
     */
    search(criteria: Map<string, any>, options?: QueryOptions): Promise<Array<T>>;
}

/**
 * RealmRepository defines data access methods for realm objects
 */
export interface RealmRepository extends Repository<IRealm> {
    /**
     * This method finds object by id
     * @param {*} id - database id
     */
    findById(id: number): Promise<IRealm>;

    /**
     * This method finds realm by name
     * @param {*} realmName
     */
    findByName(realmName: string): Promise<IRealm>;

    /**
     * This method saves object and returns updated object
     * @param {*} realm - to save
     */
    save(realm: IRealm): Promise<IRealm>;

    /**
     * This method removes object by id
     * @param {*} id - database id
     */
    removeById(id: number): Promise<boolean>;

    /**
     * This method queries database and returns list of objects
     */
    search(criteria: Map<string, any>, options?: QueryOptions): Promise<Array<IRealm>>;
}

/**
 * RoleRepository defines data access methods for role objects
 */
export interface RoleRepository extends Repository<IRole> {
    /**
     * This method finds object by id
     * @param {*} id - database id
     */
    findById(id: number): Promise<IRole>;

    /**
     * This method finds role by name
     * @param {*} realmName
     * @param {*} roleName
     */
    findByName(realmName: string, roleName: string): Promise<IRole>;

    /**
     * This method saves object and returns updated object
     * @param {*} role - to save
     */
    save(role: IRole): Promise<IRole>;

    /**
     * This method removes object by id
     * @param {*} id - database id
     */
    removeById(id: number): Promise<boolean>;

    /**
     * This method queries database and returns list of objects
     */
    search(criteria: Map<string, any>, options?: QueryOptions): Promise<Array<IRole>>;

    /**
     * This method save role to principal
     * @param {*} principal
     * @param {*} roles
     */
    __savePrincipalRoles(principal: IPrincipal): Promise<IPrincipal>;

    /**
     * This method loads roles for principal
     */
    __loadPrincipalRoles(principal: IPrincipal): Promise<IPrincipal>;

   /**
     * This method adds set of roles as parent
     */
    addParentsToRole(role: IRole, parents: Array<IRole>): Promise<IRole>;

    /**
     * This method remove set of roles as parent
     */
    removeParentsFromRole(role: IRole, parents: Array<IRole>): Promise<IRole>;
}

/**
 * ClaimRepository defines data access methods for Claim objects
 */
export interface ClaimRepository extends Repository<IClaim> {
    /**
     * This method finds object by id
     * @param {*} id - database id
     */
    findById(id: number): Promise<IClaim>;

    /**
     * This method saves object and returns updated object
     * @param {*} Claim - to save
     */
    save(claim: IClaim): Promise<IClaim>;

    /**
     * This method removes object by id
     * @param {*} id - database id
     */
    removeById(id: number): Promise<boolean>;

    /**
     * This method queries database and returns list of objects
     */
    search(criteria: Map<string, any>, options?: QueryOptions): Promise<Array<IClaim>>;

    /**
     * This method save claims for principal
     */
    __savePrincipalClaims(principal: IPrincipal): Promise<IPrincipal>;

    /**
     * This method save claims for role
     */
    __saveRoleClaims(role: IRole): Promise<IRole>;

    /**
     * This method loads claims for given principal using claims associated with role and principal
     */
    __loadPrincipalClaims(principal: IPrincipal): Promise<IPrincipal>;

    /**
     * This method load claims for role
     */
    __loadRoleClaims(role: IRole): Promise<IRole>;
}

/**
 * PrincipalRepository defines data access methods for principal objects
 */
export interface PrincipalRepository extends Repository<IPrincipal> {
    /**
     * This method finds object by id
     * @param {*} id - database id
     */
    findById(id: number): Promise<IPrincipal>;

    /**
     * This method finds principal by name
     * @param {*} realmName
     * @param {*} principalName
     */
    findByName(realmName: string, principalName: string): Promise<IPrincipal>;

    /**
     * This method saves object and returns updated object
     * @param {*} principal - to save
     */
    save(principal: IPrincipal): Promise<IPrincipal>;

    /**
     * This method removes object by id
     * @param {*} id - database id
     */
    removeById(id: number): Promise<boolean>;

    /**
     * This method queries database and returns list of objects
     */
    search(criteria: Map<string, any>, options?: QueryOptions): Promise<Array<IPrincipal>>;
}
