/* @flow Interface file */
import {SecurityAccessRequest}      from '../domain/security_access_request';
import {ClaimEffects}               from '../domain/interface';


/**
 * SecurityManager checks if principal or role has proper access to claims
 */
export interface ISecurityManager {
	/**
	 * This method returns true if condition is true given context
	 *
	 * @param {*} request - encapsulates request to check
	 * @return - string with allow if access is granted, deny otherwise.
	 */
	check(request: SecurityAccessRequest): Promise<ClaimEffects>;
}
