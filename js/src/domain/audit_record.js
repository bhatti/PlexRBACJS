const assert = require('assert');
/**
 * AuditRecord is used to record changes to the system
 */
class AuditRecord {
    constructor(theRealm, thePrincipalName, theType, theAction, theResource) {
        assert(theRealm, 'realm-name is required for audit-record');
        assert(thePrincipalName, 'principal-name is required for audit-record');
        assert(theType, 'type is required for audit-record');
        assert(theAction, 'action is required for audit-record');
        assert(theResource, 'resource is required for audit-record');
        //
        this.realm          = theRealm;
        this.principalName  = thePrincipalName;
        this.action         = theAction;
        this.type           = theType;
        this.action         = theAction;
        this.resource       = theResource;
    }
}
module.exports = AuditRecord;
