/* @flow Interface file */
import type {IPrincipal}            from '../domain/interface';
import type {IClaim}                from '../domain/interface';
import type {IRealm}                from '../domain/interface';
import type {IRole}                 from '../domain/interface';
import type {ClaimRepository}       from '../repository/interface';
import type {PrincipalRepository}   from '../repository/interface';
import type {RealmRepository}       from '../repository/interface';
import type {RoleRepository}        from '../repository/interface';
import {PersistenceError}           from '../repository/persistence_error';
import type {ISecurityService}      from './interface';

/**
 * SecurityService implements ISecurityService and provides access
 * to manage principals, roles, and claims
 */
export class SecurityService implements ISecurityService {
    claimRepository:        ClaimRepository;
    principalRepository:    PrincipalRepository;
    realmRepository:        RealmRepository;
    roleRepository:         RoleRepository;

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
    async getPrincipal(realmName: string, principalName: string): Promise<IPrincipal> {
        return this.principalRepository.findByName(realmName, principalName);
    }

    /**
     * This method saves principal
     * @param {*} principal - to save
     */
    async addPrincipal(principal: IPrincipal): Promise<IPrincipal> {
        return this.principalRepository.save(principal);
    }

    /**
     * This method removes principal
     * @param {*} principal - to remove
     * @return true if successfully removed
     */
    async removePrincipal(principal: IPrincipal): Promise<boolean> {
        return this.principalRepository.removeById(principal.id);
    }

    /**
     * This method adds realm
     * @param {*} realm - realm
     * @return - realm
     */
    async addRealm(realm: IRealm): Promise<IRealm> {
        return this.realmRepository.save(realm);
    }

    /**
     * This method retrieves realm by realm-name
     * @param {*} realmName - realm-name
     * @return - realm
     */
    async getRealm(realmName: string): Promise<IRealm> {
        return this.realmRepository.findByName(realmName);
    }

    /**
     * This method adds role
     * @param {*} role - to save
     * @return - saved role
     */
    async addRole(role: IRole): Promise<IRole> {
        return this.roleRepository.save(role);
    }

    /**
     * This method remove role
     * @param {*} role - to delete
     * @return true if successfully removed
     */
    async removeRole(role: IRole): Promise<boolean> {
        return this.roleRepository.removeById(role.id);
    }    

    /**
     * This method adds claim
     * @param {*} claim - to save
     */
    async addClaim(claim: IClaim): Promise<IClaim> {
        return this.claimRepository.save(claim);
    }

    /**
     * This method removes claim
     * @param {*} claim
     * @return true if successfully removed
     */
    async removeClaim(claim: IClaim): Promise<boolean> {
        return this.claimRepository.removeById(claim.id);
    }

   /**
     * This method adds set of roles as parent
     */
    async addParentsToRole(role: IRole, parents: Array<IRole>): Promise<IRole> {
        return this.roleRepository.addParentsToRole(role, parents);
    }

    /**
     * This method remove set of roles as parent
     */
    async removeParentsFromRole(role: IRole, parents: Array<IRole>): Promise<IRole> {
        return this.roleRepository.removeParentsFromRole(role, parents);
    }

}
