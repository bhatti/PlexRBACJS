const assert = require('assert');

/**
 * SecurityAccessRequest represents a user request that needs to be authorized
 */
class SecurityAccessRequest {
    constructor(theRealm, thePrincipal, theAction, theResource, theContext = {}) {
        assert(theRealm, 'realm-name is required');
        assert(thePrincipal, 'principalis required');
        assert(theAction, 'action is required');
        assert(theResource, 'resource is required');
        assert(theContext, 'context is required');
        //
        this.realm          = theRealm;
        this.principalName  = thePrincipal;
        this.action         = theAction;
        this.resource       = theResource;
        this.context        = theContext;
    }

    /**
     * returns textual representation
     */
    toString() {
        return `(${this.realm}, ${this.principalName}, ${this.resource})`;
    }
}
module.exports = SecurityAccessRequest;
