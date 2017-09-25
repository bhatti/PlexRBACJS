/**
 * AuthorizationError defines error that is thrown upon claim/permission fails
 */
class AuthorizationError extends Error {
    constructor(message, theRealm, thePrincipalName, theAction, theResource, theContext = {}) {
        super(message);
        this.realm          = theRealm;
        this.principalName  = thePrincipalName;
        this.action         = theAction;
        this.resource       = theResource;
        this.context        = theContext;
        this.name = this.constructor.name;
        if (typeof Error.captureStackTrace === 'function') {
            Error.captureStackTrace(this, this.constructor);
        } else {
            this.stack = (new Error(message)).stack;
        }
    }
}
module.exports = AuthorizationError;
