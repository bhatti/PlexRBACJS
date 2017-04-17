/* @flow */
import type {SecurityManager}       from './interface';
import type {ConditionEvaluator}    from '../expr/interface';
import {SecurityAccessRequest}      from '../domain/security_access_request';
import {AuthorizationError}         from '../domain/auth_error';
import type {SecurityService}       from '../service/interface';

/**
 * SecurityManagerImpl implements SecurityManager and checks if
 * principal or role has proper access to claims
 */
class SecurityManagerImpl implements SecurityManager {
    conditionEvaluator: ConditionEvaluator;
    securityService: SecurityService;

    constructor(theConditionEvaluator: ConditionEvaluator, theSecurityService: SecurityService) {
        this.conditionEvaluator = theConditionEvaluator;
        this.securityService = theSecurityService;
    }

    /**
     * This method returns true if condition is true given context
     *
     * @param {*} request - encapsulates request to check
     * @return - true if access is granted, false otherwise.
     */
    async check(request: SecurityAccessRequest): Promise<boolean> {
        try {
            let principal = await this.securityService.getPrincipal(request.realmName, request.principalName);
            let allClaims = principal.allClaims();
            allClaims.forEach(claim => {
                if (claim.implies(request.action, request.resource)) {
                    if (claim.hasCondition()) {
                        if (this.conditionEvaluator.evaluate(claim.condition, request.context)) {
                            console.log(`Granted conditional ${String(claim)} to ${request.principalName}`);
                            return true;
                        } else {
                            console.log(`Failed to authorize ${String(claim)} to ${request.principalName}`);
                        }
                    } else {
                        console.log(`Granted ${String(claim)} to ${request.principalName}`);
                        return true;
                    }
                }
            });
            return false;
        } catch(err) {
            throw new AuthorizationError(`Failed to authorize ${String(request)} due to ${err}`);
        }
    }
}
