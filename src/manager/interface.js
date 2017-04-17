/* @flow Interface file */
import {SecurityAccessRequest}      from '../domain/security_access_request';

/**
 * SecurityManager checks if principal or role has proper access to claims
 */
export interface SecurityManager {
    /**
     * This method returns true if condition is true given context
     *
     * @param {*} request - encapsulates request to check
     * @return - true if access is granted, false otherwise.
     */
    check(request: SecurityAccessRequest): Promise<boolean>;
}
