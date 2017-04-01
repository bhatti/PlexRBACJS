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
import type {SecurityCache}         from '../cache/interface';
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
    cache: SecurityCache;

    constructor(theClaimRepository: ClaimRepository, 
                thePrincipalRepository: PrincipalRepository,
                theRealmRepository: RealmRepository,
                theRoleRepository: RoleRepository,
                theCache: SecurityCache) {
        this.claimRepository = theClaimRepository;
        this.principalRepository = thePrincipalRepository;
        this.realmRepository = theRealmRepository;
        this.roleRepository = theRoleRepository;
        this.cache = theCache;
    }

    /**
     * This method retrieves principal by name
     * @param {*} principalName - to look
     * @return principal
     */
    getPrincipal(principalName: string): Principal {
        let principal = this.cache.get('principal', principalName, () => {
            return this.principalRepository.findByName(principalName);
        });
        if (principal) {
            return principal;
        }
        throw new PersistenceError(`Could not find principal with name ${principalName}`);

    }

    /**
     * This method saves principal
     * @param {*} principal - to save
     */
    addPrincipal(principal: Principal): Principal {
        let saved = this.principalRepository.save(principal);
        this.cache.set('principal', principal.principalName, saved);
        return saved;
    }

    /**
     * This method removes principal
     * @param {*} principal - to remove
     * @return true if successfully removed
     */
    removePrincipal(principal: Principal): boolean {
        let removed = this.principalRepository.removeById(principal.id);
        this.cache.remove('principal', principal.principalName);
        return removed;
    }

    /**
     * This method adds realm 
     * @param {*} realm - realm
     * @return - realm
     */
    addRealm(realm: Realm): Realm {
        let saved = this.realmRepository.save(realm);
        this.cache.set('realm', realm.realmName, saved);
        return saved;
    }

    /**
     * This method retrieves realm by realm-name
     * @param {*} realmName - realm-name
     * @return - realm
     */
    getRealm(realmName: string): Realm {
        let realm = this.cache.get('realm', realmName, () => {
            return this.realmRepository.findByName(realmName);
        });
        if (realm) {
            return realm;
        }
        throw new PersistenceError(`Could not find realm with name ${realmName}`);
    }

    /**
     * This method adds role
     * @param {*} role - to save
     * @return - saved role
     */
    addRole(role: Role): Role {
        let saved = this.roleRepository.save(role);
        this.cache.set('role', role.roleName, saved);
        return saved;
    }

    /**
     * This method remove role
     * @param {*} role - to delete
     * @return true if successfully removed
     */
    removeRole(role: Role): boolean {
        this.cache.remove('role', role.roleName);
        return this.roleRepository.removeById(role.id);
    }

    /**
     * This method adds role to principal
     * @param {*} principal
     * @param {*} role
     */
    addRoleToPrincipal(principal: Principal, role: Role): void {
        this.roleRepository.addRoleToPrincipal(principal, role);
        this.cache.set('principal', principal.principalName, principal);
    }

    /**
     * This method removes role from principal
     * @param {*} principal
     * @param {*} role
     */
    removeRoleFromPrincipal(principal: Principal, role: Role): void {
        this.roleRepository.removeRoleFromPrincipal(principal, role);
        this.cache.set('principal', principal.principalName, principal);
    }

    /**
     * This method adds claim
     * @param {*} claim - to save
     */
    addClaim(claim: Claim): Claim {
        return this.claimRepository.save(claim);
    }

    /**
     * This method removes claim
     * @param {*} claim
     * @return true if successfully removed
     */
    removeClaim(claim: Claim): boolean {
        return this.claimRepository.removeById(claim.id);
    }

    /**
     * This method adds claims to principal
     */
    addClaimToPrincipal(principal: Principal, claim: Claim): void {
        this.claimRepository.addClaimToPrincipal(principal, claim);
        this.cache.set('principal', principal.principalName, principal);
    }

    /**
     * This method adds claims to role
     */
    addClaimToRole(role: Role, claim: Claim): void {
        this.claimRepository.addClaimToRole(role, claim);
    }

   /**
     * This method removes claims from principal
     */
    removeClaimFromPrincipal(principal: Principal, claim: Claim) {
        this.claimRepository.removeClaimFromPrincipal(principal, claim);
        this.cache.set('principal', principal.principalName, principal);
    }

    /**
     * This method remove claims from role
     */
    removeClaimFromRole(role: Role, claim: Claim) {
        this.claimRepository.removeClaimFromRole(role, claim);
        this.cache.set('role', role.roleName, role);
    }

    /**
     * This method loads claims for given principal
     */
    loadPrincipalClaims(principal: Principal): void {
        this.claimRepository.loadPrincipalClaims(principal);
        this.cache.set('principal', principal.principalName, principal);
    }

    /**
     * This method loads claims for given role
     */
    loadRoleClaims(role: Role): void {
        this.claimRepository.loadRoleClaims(role);
        this.cache.set('role', role.roleName, role);
    }
}