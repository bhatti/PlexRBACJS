const assert = require('assert');
/**
 * Claim defins access attributes for a resource
 */
class Claim {

    constructor(theRealm, theAction, theResource, theCondition, theStartDate, theEndDate) {
        assert(theRealm, 'realm is required for claim');
        assert(theAction, 'action is required for claim');
        assert(theResource, 'resource is required for claim');

        this.action     = theAction;
        this.resource   = theResource;
        this.condition  = theCondition;
        this.realm      = theRealm;
        this.startDate  = theStartDate || new Date();
        this.endDate    = theEndDate || new Date(new Date().setFullYear(new Date().getFullYear() + 5));
        this.effect     = 'allow';
    }

    assertEqual(other) {
        assert(this.realm == other.realm);
        assert(this.action == other.action);
        assert(this.resource == other.resource);
        assert(this.startDateISO() == other.startDateISO());
        assert(this.endDateISO() == other.endDateISO());
    }

    uniqueKey() {
        return `${this.realm}_${this.action}_${this.resource}_${this.condition}`;
    }
    /**
     * returns textual representation
     */
    toString() {
        return this.uniqueKey();
    }

    hasCondition() {
        return this.condition != null && this.condition != undefined && this.condition.length > 0;
    }

    startDateISO() {
        return this.startDate.toISOString().split('T')[0] + 'T23:59:59';
    }

    endDateISO() {
        return this.endDate.toISOString().split('T')[0] + 'T23:59:59';
    }

    /**
     * This method checks if given action and resource matches internal action and action.
     * It tries to compare action and resource directly or using regex
     *
     * @param {*} action
     * @param {*} resource
     */
    implies(theAction, theResource) {
         return (this.action == '*' || this.action == theAction ||
            theAction.match(this.action) != null) &&
            this.resource == theResource;
    }

    static parse(json) {
        assert(json.realm, `realm is required for claim ${JSON.stringify(json)}`);
        assert(json.action, `action is required for claim ${JSON.stringify(json)}`);
        assert(json.resource, `resource is required for claim ${JSON.stringify(json)}`);
        return new Claim(json.realm, json.action, json.resource, json.condition, 
            new Date(Date.parse(json.startDate)), new Date(Date.parse(json.endDate)));
    }
}

Claim.allow         = 'allow';
Claim.deny          = 'deny';
Claim.defaultDeny   = 'defaultDeny';
module.exports = Claim;
