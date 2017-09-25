/*@flow*/
import type {IAuditRecord, IRealm}    from './interface';
import type {UniqueIdentifier}  from '../util/unique_id';

const assert        = require('assert');
const _realm        = Symbol('realm');

/**
 * AuditRecord is used to record changes to the system
 */
export class AuditRecord implements IAuditRecord, UniqueIdentifier {
    id:         number;     // unique database id

    realmName:  string;  // realm-name

    principalName:  string;  // principal-name

    type: string

    action: string;

    resource: string;

    constructor(theRealm:       IRealm,
                thePrincipalName:   string,
                theType:        string,
                theAction:      string,
                theResource:    string) {
        //
        assert(theRealm, 'realm is required');
        assert(thePrincipalName, 'principal-name is required');
        assert(theType, 'type is required');
        assert(theAction, 'action is required');
        assert(theResource, 'resource is required');
        assert(theRealm.id, 'realm-id not specified');

        //
        this.action     = theAction;
        this.principalName  = thePrincipalName;
        this.type       = theType;
        this.action     = theAction;
        this.resource   = theResource;
        (this: any)[_realm]       = theRealm;
    }

    realm(): IRealm {
        return (this: any)[_realm];
    }
}
