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
     * @param {*} realmName - domain of application
     * @param {*} principalName - to look
     * @return principal
     */
    getPrincipal(realmName: string, principalName: string): Promise<Principal>;

    /**
     * This method saves principal
     * @param {*} principal - to save
     */
    addPrincipal(principal: Principal): Promise<Principal>;

    /**
     * This method removes principal
     * @param {*} principal - to remove
     * @return true if successfully removed
     */
    removePrincipal(principal: Principal): Promise<boolean>;

    /**
     * This method adds realm
     * @param {*} realm - realm
     * @return - realm
     */
    addRealm(realm: Realm): Promise<Realm>;

    /**
     * This method retrieves realm by realm-name
     * @param {*} realmName - realm-name
     * @return - realm
     */
    getRealm(realmName: string): Promise<Realm>;

    /**
     * This method adds role
     * @param {*} role - to save
     * @return - saved role
     */
    addRole(role: Role): Promise<Role>;

    /**
     * This method remove role
     * @param {*} role - to delete
     * @return true if successfully removed
     */
    removeRole(role: Role): Promise<boolean>;

    /**
     * This method adds role to principal
     * @param {*} principal
     * @param {*} roles
     */
    addRolesToPrincipal(principal: Principal, roles: Set<Role>): Promise<Principal>;

    /**
     * This method removes role from principal
     * @param {*} principal
     * @param {*} roles
     */
    removeRolesFromPrincipal(principal: Principal, roles: Set<Role>): Promise<Principal>;

    /**
     * This method adds claim
     * @param {*} claim - to save
     */
    addClaim(claim: Claim): Promise<Claim>;

    /**
     * This method removes claim
     * @param {*} claim
     * @return true if successfully removed
     */
    removeClaim(claim: Claim): Promise<boolean>;

    /**
     * This method adds set of roles as parent
     */
    addParentsToRole(role: Role, parents: Set<Role>): Promise<Role>;

    /**
     * This method remove set of roles as parent
     */
    removeParentsFromRole(role: Role, parents: Set<Role>): Promise<Role>;

    /**
     * This method adds claims to principal
     */
    addClaimsToPrincipal(principal: Principal, claims: Set<Claim>): Promise<Principal>;

    /**
     * This method adds claims to role
     */
    addClaimsToRole(role: Role, claims: Set<Claim>): Promise<Role>;

    /**
     * This method removes claims from principal
     */
    removeClaimsFromPrincipal(principal: Principal, claims: Set<Claim>): Promise<Principal>;

    /**
     * This method remove claims from role
     */
    removeClaimsFromRole(role: Role, claims: Set<Claim>): Promise<Role>;

    /**
     * This method loads claims for given principal
     */
    loadPrincipalClaims(principal: Principal): Promise<Principal>;
    /**
     * This method loads claims for given role
     */
    loadRoleClaims(role: Role): Promise<Role>;
}
