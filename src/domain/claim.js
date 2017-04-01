/*@flow*/

import type {Claim, Realm}      from './interface';

/**
 * ClaimImpl implements Claim for defining access attributes
 */
export class ClaimImpl implements Claim {
    id: number;         // unique database id

    realm: Realm;       // realm for the application

    action: string;     // This can be a single operation or regex based multiple operations

    resource: string;   // target resource

    condition: string;  // This is optional for specifying runtime condition

    constructor() {
    }

    constructor(theId: number, 
                theRealm: Realm, 
                theAction: string, 
                theResource: string, 
                theCondition: string) {
        //
        this.id = theId;
        this.realm = theRealm;
        this.action = theAction;
        this.resource = theResource;
        this.condition = theCondition;
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