/* @flow Interface file */
import type {IPrincipal}     from '../domain/interface';
import type {IClaim}         from '../domain/interface';
import type {IRealm}         from '../domain/interface';
import type {IRole}          from '../domain/interface';

/**
 * SecurityService provides access to manage principals, roles, and claims
 */
export interface ISecurityService {
    /**
     * This method retrieves principal by name
     * @param {*} realmName - domain of application
     * @param {*} principalName - to look
     * @return principal
     */
    getPrincipal(realmName: string, principalName: string): Promise<IPrincipal>;

    /**
     * This method saves principal
     * @param {*} principal - to save
     */
    addPrincipal(principal: IPrincipal): Promise<IPrincipal>;

    /**
     * This method removes principal
     * @param {*} principal - to remove
     * @return true if successfully removed
     */
    removePrincipal(principal: IPrincipal): Promise<boolean>;

    /**
     * This method adds realm
     * @param {*} realm - realm
     * @return - realm
     */
    addRealm(realm: IRealm): Promise<IRealm>;

    /**
     * This method retrieves realm by realm-name
     * @param {*} realmName - realm-name
     * @return - realm
     */
    getRealm(realmName: string): Promise<IRealm>;

    /**
     * This method adds role
     * @param {*} role - to save
     * @return - saved role
     */
    addRole(role: IRole): Promise<IRole>;

    /**
     * This method remove role
     * @param {*} role - to delete
     * @return true if successfully removed
     */
    removeRole(role: IRole): Promise<boolean>;

    /**
     * This method adds claim
     * @param {*} claim - to save
     */
    addClaim(claim: IClaim): Promise<IClaim>;

    /**
     * This method removes claim
     * @param {*} claim
     * @return true if successfully removed
     */
    removeClaim(claim: IClaim): Promise<boolean>;

    /**
     * This method adds set of roles as parent
     */
    addParentsToRole(role: IRole, parents: Array<IRole>): Promise<IRole>;

    /**
     * This method remove set of roles as parent
     */
    removeParentsFromRole(role: IRole, parents: Array<IRole>): Promise<IRole>;
}
