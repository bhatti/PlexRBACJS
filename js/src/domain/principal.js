const assert = require('assert');
const Claim       = require('../domain/claim');
const Limits      = require('../domain/limits');
const UniqueArray = require('../util/unique_array');
/**
 * Principal is used to represent user of the system 
 */
class Principal {
    constructor(theRealm, thePrincipalName, theProps) {
        assert(theRealm, 'realm-name is required');
        assert(thePrincipalName, 'principal is required');
        this.realm          = theRealm;
        this.principalName  = thePrincipalName;
        this.claims         = new UniqueArray();
        this.roles          = new UniqueArray();
        this.limits         = new UniqueArray();
        this.properties     = theProps || {};
    }

    uniqueKey() {
        return `${this.realm}_${this.principalName}`;
    }

    assertEqual(other) {
        assert(this.realm == other.realm); 
        assert(this.principalName == other.principalName); 
        assert(this.claims.length == other.claims.length); 
        for (var i=0; i<this.claims.length; i++) {
            this.claims[i].assertEqual(other.claims[i]);
        }
        assert(this.roles.length == other.roles.length); 
        for (var i=0; i<this.roles.length; i++) {
            this.roles[i].assertEqual(other.roles[i]);
        }
        assert(this.limits.length == other.limits.length); 
        for (var i=0; i<this.limits.length; i++) {
            this.limits[i].assertEqual(other.limits[i]);
        }
        assert(this.properties.length == other.properties.length); 
        for (let key of Object.keys(this.properties)) {
            let value = this.properties[key];
            let otherValue = other.properties[key];
            assert(value == otherValue); 
        }
        return true;
    }

    /**
     * returns textual representation
     */
    toString() {
        return this.uniqueKey();
    }

    /**
     * This method finds all claims that are attached to the principal directly 
     * or attached to any of roles or their parents 
     * @return list of claims
     */
    allClaims() {
        let allClaims = new UniqueArray();
        this.claims.forEach(claim => {
            allClaims.add(claim);
        });
        this.roles.forEach(role => {
            role.___loadRoleClaims(allClaims);
        });
        return allClaims;
    }

    static parse(json) {
        let principal = new Principal(json.realm, json.principalName, json.properties);
        json.claims.reduce((list, claim) => {list.add(Claim.parse(claim)); return list;}, principal.claims);
        json.limits.reduce((list, limit) => {list.add(Limits.parse(limit)); return list;}, principal.limits);
        // skip complete json.roles mapping
        principal.roles = json.roles;
        return principal;
    }
}
module.exports = Principal;
