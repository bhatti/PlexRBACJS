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
    getPrincipal(principalName: string): Promise<Principal> {
        let principal = this.cache.get('principal', principalName);
        if (principal) {
            return principal;
        }
        return this.principalRepository.findByName(principalName).
        then(principalFound => {
            this.cache.set('principal', principalName, principalFound);
            return principalFound;
        }).catch(err => {
            throw new PersistenceError(`Could not find principal with name ${principalName} due to ${err}`);
        });
    }

    /**
     * This method saves principal
     * @param {*} principal - to save
     */
    addPrincipal(principal: Principal): Promise<Principal> {
        return this.principalRepository.save(principal).
        then(saved => {
            this.cache.set('principal', principal.principalName, saved);
            return saved;
        }).catch(err => {
            throw new PersistenceError(`Could not save principal ${String(principal)} due to ${err}`);
        });
    }

    /**
     * This method removes principal
     * @param {*} principal - to remove
     * @return true if successfully removed
     */
    removePrincipal(principal: Principal): Promise<boolean> {
        return this.principalRepository.removeById(principal.id).
        then(removed => {
            this.cache.remove('principal', principal.principalName);
            return removed;
        }).catch(err => {
            return false;
        });
    }

    /**
     * This method adds realm 
     * @param {*} realm - realm
     * @return - realm
     */
    addRealm(realm: Realm): Promise<Realm> {
        return this.realmRepository.save(realm).
        then(saved => {
            this.cache.set('realm', realm.realmName, saved);
            return saved;
        }).catch(err => {
            throw new PersistenceError(`Could not add realm with name ${String(realm)} due to ${err}`); 
        });
    }

    /**
     * This method retrieves realm by realm-name
     * @param {*} realmName - realm-name
     * @return - realm
     */
    getRealm(realmName: string): Promise<Realm> {
        let realm = this.cache.get('realm', realmName);
        if (realm) {
            return realm;
        }
        return this.realmRepository.findByName(realmName).
        then(realmFound => {
            this.cache.set('realm', realmFound.realmName, realmFound);
            return realmFound;
        }).catch(err => {
            throw new PersistenceError(`Could not find realm with name ${realmName} due to ${err}`);
        });
    }

    /**
     * This method adds role
     * @param {*} role - to save
     * @return - saved role
     */
    addRole(role: Role): Promise<Role> {
        return this.roleRepository.save(role).
        then(saved => {
            this.cache.set('role', role.roleName, saved);
            return saved;
        }).catch(err => {
            throw new PersistenceError(`Could not save role ${String(role)} due to ${err}`);
        });
    }

    /**
     * This method remove role
     * @param {*} role - to delete
     * @return true if successfully removed
     */
    removeRole(role: Role): Promise<boolean> {
        return this.roleRepository.removeById(role.id).
        then(removed => {
            this.cache.remove('role', role.roleName);
            return removed ;
        }).catch(err => {
            return false;
        });
    }

    /**
     * This method adds role to principal
     * @param {*} principal
     * @param {*} role
     */
    addRoleToPrincipal(principal: Principal, role: Role): Promise<void> {
        return this.roleRepository.addRoleToPrincipal(principal, role).
        then( () => {
            this.cache.set('principal', principal.principalName, principal);
            return;
        }).catch(err => {
            throw new PersistenceError(`Could not add role ${String(role)} to principal ${String(principal)} due to ${err}`);
        });
    }

    /**
     * This method removes role from principal
     * @param {*} principal
     * @param {*} role
     */
    removeRoleFromPrincipal(principal: Principal, role: Role): Promise<void> {
        return this.roleRepository.removeRoleFromPrincipal(principal, role).
        then(result  => {
            this.cache.set('principal', principal.principalName, principal);
            return;
        }).catch(err => {
            throw new PersistenceError(`Could not remove role ${String(role)} to principal ${String(principal)} due to ${err}`);
        });
    }

    /**
     * This method adds claim
     * @param {*} claim - to save
     */
    addClaim(claim: Claim): Promise<Claim> {
        return this.claimRepository.save(claim).
        then( saved => {
            return saved;
        }).catch(err => {
            throw new PersistenceError(`Could not add claim ${String(claim)} due to ${err}`);
        });
    }

    /**
     * This method removes claim
     * @param {*} claim
     * @return true if successfully removed
     */
    removeClaim(claim: Claim): Promise<boolean> {
        return this.claimRepository.removeById(claim.id).
        then(removed => {
            return removed;
        });
    }

    /**
     * This method adds claims to principal
     */
    addClaimToPrincipal(principal: Principal, claim: Claim): Promise<void> {
        return this.claimRepository.addClaimToPrincipal(principal, claim).
        then( () => {
            this.cache.set('principal', principal.principalName, principal);
            return;
        }).catch(err => {
            throw new PersistenceError(`Could not add claim ${String(claim)} to ${String(principal)} due to ${err}`);
        });
    }

    /**
     * This method adds claims to role
     */
    addClaimToRole(role: Role, claim: Claim): Promise<void> {
        return this.claimRepository.addClaimToRole(role, claim).
        then( () => {
            this.cache.set('role', role.roleName, role);
            return;
        }).catch(err => {
            throw new PersistenceError(`Could not add claim ${String(claim)} to ${String(role)} due to ${err}`);
        });
    }

   /**
     * This method removes claims from principal
     */
    removeClaimFromPrincipal(principal: Principal, claim: Claim): Promise<void> {
        return new Promise((resolve, reject) => {
            this.claimRepository.removeClaimFromPrincipal(principal, claim).
            then( () => {
                this.cache.set('principal', principal.principalName, principal);
                resolve();
            }).catch(err => {
                reject(err);
            });
        });
    }

    /**
     * This method remove claims from role
     */
    removeClaimFromRole(role: Role, claim: Claim) : Promise<void> {
        return this.claimRepository.removeClaimFromRole(role, claim).
        then( () => {
            this.cache.set('role', role.roleName, role);
            return;
        }).catch(err => {
            throw new PersistenceError(`Could not remove claim ${String(claim)} from ${String(role)} due to ${err}`);
        });
    }

    /**
     * This method loads claims for given principal
     */
    loadPrincipalClaims(principal: Principal): Promise<void> {
        return this.claimRepository.loadPrincipalClaims(principal).
        then( () => {
            this.cache.set('principal', principal.principalName, principal);
            return;
        }).catch(err => {
            throw new PersistenceError(`Could not load claims for ${String(principal)} due to ${err}`);
        });
    }

    /**
     * This method loads claims for given role
     */
    loadRoleClaims(role: Role): Promise<void> {
        return this.claimRepository.loadRoleClaims(role).
        then( () => {
            this.cache.set('role', role.roleName, role);
            return;
        }).catch(err => {
            throw new PersistenceError(`Could not load claims for ${String(role)} due to ${err}`);
        });
    }
}
