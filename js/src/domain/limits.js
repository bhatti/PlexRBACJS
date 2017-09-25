const assert = require('assert');
/**
 * Limits tracks resource usage by a principal
 */
class Limits {
    constructor(theType, theResource, theMaxLimit, theUsed, theExpirationDate) {
        assert(theType, 'type is required for limits');
        assert(theResource, 'resource is required for limits');
        //
        this.type       = theType;
        this.resource   = theResource;
        this.maxAllowed   = theMaxLimit;
        this.value       = theUsed || 0;
        this.expirationDate   = theExpirationDate || new Date(new Date().setFullYear(new Date().getFullYear() + 50));
    }

    assertEqual(other) {
        assert(this.type == other.type);
        assert(this.resource == other.resource);
        assert(this.maxAllowed == other.maxAllowed);
        assert(this.value == other.value);
        assert(this.expirationISODate() == other.expirationISODate());
    }

    uniqueKey() {
        return `${this.type}_${this.resource}`;
    }
    /**
     * returns textual representation
     */
    toString() {
        return this.uniqueKey();
    }

    expirationISODate() {
        return this.expirationDate.toISOString().split('T')[0] + 'T23:59:59';
    }

    valid() {
        return this.value <= this.maxAllowed && Date.parse(this.expirationISODate()) >= new Date().getTime();
    }

    static parse(json) {
        return new Limits(json.type, json.resource, json.maxAllowed, json.value, new Date(Date.parse(json.expirationDate)));
    }

}
module.exports = Limits;
