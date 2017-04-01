/* @flow Interface file */
import type {Principal}     from '../domain/interface';
import type {Claim}         from '../domain/interface';
import type {Realm}         from '../domain/interface';
import type {Role}          from '../domain/interface';

/**
 * SecurityService provides access to manage principals, roles, and claims
 */
export interface SecurityService {
    /**
     * This method retrieves principal by name
     * @param {*} principalName - to look
     * @return principal
     */
    getPrincipal(principalName: string): Principal; 

    /**
     * This method saves principal
     * @param {*} principal - to save
     */
    addPrincipal(principal: Principal): Principal; 

    /**
     * This method removes principal
     * @param {*} principal - to remove
     * @return true if successfully removed
     */
    removePrincipal(principal: Principal): boolean; 

    /**
     * This method adds realm 
     * @param {*} realm - realm
     * @return - realm
     */
    addRealm(realm: Realm): Realm;

    /**
     * This method retrieves realm by realm-name
     * @param {*} realmName - realm-name
     * @return - realm
     */
    getRealm(realmName: string): Realm;

    /**
     * This method adds role
     * @param {*} role - to save
     * @return - saved role
     */
    addRole(role: Role): Role; 

    /**
     * This method remove role
     * @param {*} role - to delete
     * @return true if successfully removed
     */
    removeRole(role: Role): boolean; 

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
     * This method adds claim
     * @param {*} claim - to save
     */
    addClaim(claim: Claim): Claim; 

    /**
     * This method removes claim
     * @param {*} claim
     * @return true if successfully removed
     */
    removeClaim(claim: Claim): boolean; 

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
     * This method loads claims for given principal
     */
    loadPrincipalClaims(principal: Principal): void;
    /**
     * This method loads claims for given role
     */
    loadRoleClaims(role: Role): void; 
}
