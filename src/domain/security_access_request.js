/*@flow*/
const assert = require('assert');

/**
 * RoleImpl implements Role for defining function or job
 */
export class SecurityAccessRequest {
    realmName: string;          // realm name for domain of the application

    principalName: string;      // principal-name (e.g. username)

    action: string;             // action to perform
    
    resource: string;           // target resource
    
    context: Map<string, any>;  // context
    
    constructor(theRealm: string, 
                thePrincipal: string,
                theAction: string,
                theResource: string,
                theContext: Map<string, any>) {
        //
        assert(theRealm, 'realm is required');
        assert(thePrincipal, 'principalis required');
        assert(theAction, 'action is required');
        assert(theResource, 'resource is required');
        assert(theContext, 'context is required');
        this.realmName      = theRealm;
        this.principalName  = thePrincipal;
        this.action         = theAction;
        this.resource       = theResource;
        this.context        = theContext;
    }
 
    /**
     * returns textual representation
     */
    toString() {
        return `(${this.realmName}, ${this.principalName}, ${this.resource})`;
    }            
}