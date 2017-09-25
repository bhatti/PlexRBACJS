const assert            = require('assert');
const Claim             = require('../domain/claim');
const Limits            = require('../domain/limits');
const Principal         = require('../domain/principal');
const Role              = require('../domain/role');
const AuthorizationError = require('../domain/auth_error');
const RepositoryLocator = require('../repository/repository_locator');
const ConditionEvaluator = require('../expr/expr_evaluator');
const SecurityAccessRequest = require('../domain/security_access_request');

/**
 * SecurityManager implements ISecurityManager and checks if
 * principal or role has proper access to claims
 */
class SecurityManager {
    constructor(theRepositoryLocator) {
        this.repositoryLocator = theRepositoryLocator;
    }

    /**
     * This method returns true if condition is true given context
     *
     * @param {*} request - SecurityAccessRequest that encapsulates request to check
     * @return - allow or deny 
     */
    async check(request) {
        try {
            assert(request.realm, 'realm-name not specified for request');
            assert(request.principalName, 'principal-name not specified for request');
            let principal = await this.repositoryLocator.principalRepository.findByPrincipalName(request.realm, request.principalName);
            assert(principal);
            let allClaims = principal.allClaims();
            let effect = Claim.defaultDeny;
            //console.log(`Checking claims for ${principal.principalName} - ${allClaims} ------- ${JSON.stringify(request)}`);
            let promises = [];
            let conditionEvaluator = new ConditionEvaluator(this.repositoryLocator, request, principal);

            allClaims.forEach(claim => {
                if (claim.implies(request.action, request.resource)) {
                    if (claim.hasCondition()) {
                        promises.push(new Promise((resolve, reject) => {
                            conditionEvaluator.evaluate(claim.condition).then(matched => {
                                if (matched) {
                                    //console.log(`### Granted conditional ${String(claim)} for ${String(request.resource)} to ${request.principalName}`);
                                    effect = claim.effect;
                                    resolve();
                                } else {
                                    //console.log(`### Failed to authorize ${String(claim)} for ${String(request.resource)} to ${request.principalName}`);
                                    resolve();
                                }
                            }).catch(e => {
                                //console.log(`Failed to check claim ${claim} due to ${e}`);
                                resolve();
                            });
                        }));
                    } else {
                        //console.log(`### Granted ${String(claim)} to ${request.principalName}`);
                        effect = claim.effect;
                    }
                }
            });
            await Promise.all(promises);
            return effect;
        } catch(err) {
            throw new AuthorizationError(`Failed to authorize ${String(request)} due to ${err}`);
        }
    }
}
module.exports = SecurityManager;
