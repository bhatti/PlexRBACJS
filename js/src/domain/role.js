const assert = require('assert');
const Claim       = require('../domain/claim');
const UniqueArray = require('../util/unique_array');

/**
 * Role implements Role for defining function or job
 */
class Role {
    constructor(theRealm, theRoleName, theStartDate, theEndDate) {
        assert(theRealm, 'realm-name is required');
        assert(theRoleName, 'role-name is required');

        this.realm             = theRealm;
        this.roleName          = theRoleName;
        this.claims            = new UniqueArray();
        this.parents           = new UniqueArray();
        this.startDate         = theStartDate || new Date();
        this.endDate           = theEndDate || new Date(new Date().setFullYear(new Date().getFullYear() + 5));
    }

    startDateISO() {
        return this.startDate.toISOString().split('T')[0] + 'T23:59:59';
    }

    endDateISO() {
        return this.endDate.toISOString().split('T')[0] + 'T23:59:59';
    }

    uniqueKey() {
        return `${this.realm}_${this.roleName}`;
    }

    assertEqual(other) {
        assert(this.realm == other.realm); 
        assert(this.roleName == other.roleName); 
        assert(this.claims.length == other.claims.length); 
        for (var i=0; i<this.claims.length; i++) {
            this.claims[i].assertEqual(other.claims[i]);
        }
        assert(this.parents.length == other.parents.length); 
        for (var i=0; i<this.parents.length; i++) {
            this.parents[i].assertEqual(other.parents[i]);
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
     * This method finds all claims that are attached to the role or their parents 
     * @return list of claims
     */
    allClaims() {
        let allClaims = new UniqueArray();
        this.___loadRoleClaims(allClaims);
        return allClaims;
    }

    static parse(json) {
        let role        = new Role(json.realm, json.roleName);
        role.startDate  = json.startDate ? new Date(Date.parse(json.startDate)) : new Date();
        role.endDate    = json.endDate ? new Date(Date.parse(json.endDate)) : new Date(new Date().setFullYear(new Date().getFullYear() + 5));
        role.parents    = json.parents || []; // we will simply assign here
        json.claims     = json.claims || [];
        for (var i=0; i<json.claims.length; i++) {
            role.claims.add(Claim.parse(json.claims[i]));
        }
        return role;
    }

    //
    ___loadRoleClaims(allClaims) {
        this.claims.forEach(claim => {
            allClaims.add(claim);
        });
        this.parents.forEach(parentRole => {
            parentRole.___loadRoleClaims(allClaims);
        });
    }

}
module.exports = Role;
