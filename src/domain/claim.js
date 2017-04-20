/*@flow*/

import type {IClaim, IRealm}    from './interface';
import type {UniqueIdentifier}  from '../util/unique_id';

const assert = require('assert');

/**
 * Claim implements IClaim for defining access attributes
 */
export class Claim implements IClaim, UniqueIdentifier {
    id:         number;     // unique database id

    realm:      IRealm;     // realm for the application

    action:     string;     // This can be a single operation or regex based multiple operations

    resource:   string;     // target resource

    condition:  string;     // This is optional for specifying runtime condition

    constructor(theRealm:       IRealm,
                theAction:      string,
                theResource:    string,
                theCondition:   string) {
        //
        assert(theRealm, 'realm is required');
        assert(theAction, 'action is required');
        assert(theResource, 'resource is required');
        //
        this.realm      = theRealm;
        this.action     = theAction;
        this.resource   = theResource;
        this.condition  = theCondition;
    }

    uniqueKey(): string {
        return `${this.realm.realmName}_${this.action}_${this.resource}_${this.condition}`;
    }

    hasCondition(): boolean {
        return this.condition != null && this.condition != undefined && this.condition.length > 0;
    }

    /**
     * This method checks if given action and resource matches internal action and action.
     * It tries to compare action and resource directly or using regex
     *
     * @param {*} action
     * @param {*} resource
     */
    implies(theAction: string, theResource: string): boolean {
         return (this.action == theAction ||
            theAction.match(this.action) != null) &&
            (this.resource == theResource || theResource.match(this.resource) != null);
    }

    /**
     * returns textual representation
     */
    toString() {
        return `(${String(this.realm)}, ${this.action}, ${this.resource}, ${this.condition})`;
    }
}
