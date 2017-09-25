/*@flow*/

import type {IClaim, IRealm, ClaimEffects}    from './interface';
import type {UniqueIdentifier}  from '../util/unique_id';

const assert        = require('assert');

const _realm        = Symbol('realm');
const _startDate    = Symbol('startDate');
const _endDate      = Symbol('endDate');

/**
 * Claim implements IClaim for defining access attributes
 */
export class Claim implements IClaim, UniqueIdentifier {
    static allow        = 'allow';
    static deny         = 'deny';
    static defaultDeny  = 'defaultDeny';

    id:         number;     // unique database id

    action:     string;     // This can be a single operation or regex based multiple operations

    resource:   string;     // target resource

    condition:  string;     // This is optional for specifying runtime condition

    effect: ClaimEffects;   // This is optional for specifying allow/deny

    constructor(theRealm:       IRealm,
                theAction:      string,
                theResource:    string,
                theCondition:   string,
                theEffect:      ?ClaimEffects,
                theStartDate:   ?Date,
                theEndDate:     ?Date) {
        //
        assert(theRealm, 'realm is required');
        assert(theAction, 'action is required');
        assert(theResource, 'resource is required');
        assert(theRealm.id, 'realm-id not specified');

        //
        this.action     = theAction;
        this.resource   = theResource;
        this.condition  = theCondition;
        this.effect     = theEffect || Claim.allow;
        (this: any)[_realm]       = theRealm;
        (this: any)[_startDate]   = theStartDate || new Date();
        (this: any)[_endDate]     = theEndDate || new Date(new Date().setFullYear(new Date().getFullYear() + 5));
    }

    uniqueKey(): string {
        return `${this.realm().realmName}_${this.action}_${this.resource}_${this.condition}`;
    }

    hasCondition(): boolean {
        return this.condition != null && this.condition != undefined && this.condition.length > 0;
    }

    realm(): IRealm {
        return (this: any)[_realm];
    }

    startDate(): string {
        return (this: any)[_startDate].toISOString().split('T')[0];
    }

    endDate(): string {
        return (this: any)[_endDate].toISOString().split('T')[0];
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
            this.resource == theResource;
    }

    /**
     * returns textual representation
     */
    toString() {
        return `(${this.id}, ${this.action}, ${this.resource}, ${this.condition})`;
    }
}
