/* @flow Interface file */
import type {Principal}             from '../domain/interface';
import type {Claim}                 from '../domain/interface';
import type {Realm}                 from '../domain/interface';
import type {Role}                  from '../domain/interface';
import type {ClaimRepository}       from '../repository/interface';
import type {PrincipalRepository}   from '../repository/interface';
import type {RealmRepository}       from '../repository/interface';
import type {RoleRepository}        from '../repository/interface';
import {PersistenceError}           from '../repository/persistence_error';
import type {SecurityService}       from './interface';

/**
 * SecurityServiceImpl implements SecurityService and provides access
 * to manage principals, roles, and claims
 */
export class SecurityServiceImpl implements SecurityService {
    claimRepository: ClaimRepository;
    principalRepository: PrincipalRepository;
    realmRepository: RealmRepository;
    roleRepository: RoleRepository;

    constructor(theClaimRepository: ClaimRepository,
                thePrincipalRepository: PrincipalRepository,
                theRealmRepository: RealmRepository,
                theRoleRepository: RoleRepository) {
        this.claimRepository = theClaimRepository;
        this.principalRepository = thePrincipalRepository;
        this.realmRepository = theRealmRepository;
        this.roleRepository = theRoleRepository;
    }

    /**
     * This method retrieves principal by name
     * @param {*} realmName - domain of application
     * @param {*} principalName - to look
     * @return principal
     */
    async getPrincipal(realmName: string, principalName: string): Promise<Principal> {
        return this.principalRepository.findByName(realmName, principalName);
    }

    /**
     * This method saves principal
     * @param {*} principal - to save
     */
    async addPrincipal(principal: Principal): Promise<Principal> {
        return this.principalRepository.save(principal);
    }

    /**
     * This method removes principal
     * @param {*} principal - to remove
     * @return true if successfully removed
     */
    async removePrincipal(principal: Principal): Promise<boolean> {
        return this.principalRepository.removeById(principal.id);
    }

    /**
     * This method adds realm
     * @param {*} realm - realm
     * @return - realm
     */
    async addRealm(realm: Realm): Promise<Realm> {
        return this.realmRepository.save(realm);
    }

    /**
     * This method retrieves realm by realm-name
     * @param {*} realmName - realm-name
     * @return - realm
     */
    async getRealm(realmName: string): Promise<Realm> {
        return this.realmRepository.findByName(realmName);
    }

    /**
     * This method adds role
     * @param {*} role - to save
     * @return - saved role
     */
    async addRole(role: Role): Promise<Role> {
        return this.roleRepository.save(role);
    }

    /**
     * This method remove role
     * @param {*} role - to delete
     * @return true if successfully removed
     */
    async removeRole(role: Role): Promise<boolean> {
        return this.roleRepository.removeById(role.id);
    }

    /**
     * This method adds role to principal
     * @param {*} principal
     * @param {*} roles
     */
    async addRolesToPrincipal(principal: Principal, roles: Set<Role>): Promise<Principal> {
        return this.roleRepository.addRolesToPrincipal(principal, roles);
    }

    /**
     * This method removes role from principal
     * @param {*} principal
     * @param {*} roles
     */
    async removeRolesFromPrincipal(principal: Principal, roles: Set<Role>): Promise<Principal> {
        return this.roleRepository.removeRolesFromPrincipal(principal, roles);
    }

    /**
     * This method adds claim
     * @param {*} claim - to save
     */
    async addClaim(claim: Claim): Promise<Claim> {
        return this.claimRepository.save(claim);
    }

    /**
     * This method removes claim
     * @param {*} claim
     * @return true if successfully removed
     */
    async removeClaim(claim: Claim): Promise<boolean> {
        return this.claimRepository.removeById(claim.id);
    }

   /**
     * This method adds set of roles as parent
     */
    async addParentsToRole(role: Role, parents: Set<Role>): Promise<Role> {
        return this.roleRepository.addParentsToRole(role, parents);
    }

    /**
     * This method remove set of roles as parent
     */
    async removeParentsFromRole(role: Role, parents: Set<Role>): Promise<Role> {
        return this.roleRepository.removeParentsFromRole(role, parents);
    }

    /**
     * This method adds claims to principal
     */
    async addClaimsToPrincipal(principal: Principal, claims: Set<Claim>): Promise<Principal> {
        return this.claimRepository.addClaimsToPrincipal(principal, claims);
    }

    /**
     * This method adds claims to role
     */
    async addClaimsToRole(role: Role, claims: Set<Claim>): Promise<Role> {
        return this.claimRepository.addClaimsToRole(role, claims);
    }

    /**
     * This method removes claims from principal
     */
    async removeClaimsFromPrincipal(principal: Principal, claims: Set<Claim>): Promise<Principal> {
        return this.claimRepository.removeClaimsFromPrincipal(principal, claims);
    }

    /**
     * This method remove claims from role
     */
    async removeClaimsFromRole(role: Role, claims: Set<Claim>) : Promise<Role> {
        return this.claimRepository.removeClaimsFromRole(role, claims);
    }

    /**
     * This method loads claims for given principal
     */
    async loadPrincipalClaims(principal: Principal): Promise<Principal> {
        return this.claimRepository.loadPrincipalClaims(principal);
    }

    /**
     * This method loads claims for given role
     */
    async loadRoleClaims(role: Role): Promise<Role> {
        return this.claimRepository.loadRoleClaims(role);
    }
}
