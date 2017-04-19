/*@flow*/

import type {Principal, Claim, Role, Realm}     from './interface';
import {UniqueArray}                            from '../util/unique_array';
import type {UniqueIdentifier}                  from '../util/unique_id';

const assert = require('assert');


export class PrincipalImpl implements Principal, UniqueIdentifier {
    /**
     * unique database id
     */
    id:             number;

    /**
     * principal name such as username
     */
    principalName:  string;

    /**
     * realm for this principal
     */
    realm:          Realm;

    /**
     * set of Claims
     */
    claims:         UniqueArray<Claim>;

    /**
     * set of roles
     */
    roles:          UniqueArray<Role>;

    constructor(theRealm: Realm,
                thePrincipalName: string) {
        //
        assert(theRealm, 'realm is required');
        assert(thePrincipalName, 'principal is required');
        //
        this.realm          = theRealm;
        this.principalName  = thePrincipalName;
        this.claims         = new UniqueArray();
        this.roles          = new UniqueArray();
    }

    uniqueKey(): string {
        return `${this.realm.realmName}_${this.principalName}`;
    }

    allClaims(): UniqueArray<Claim> {
        let allClaims: UniqueArray<Claim> = new UniqueArray();
        this.claims.forEach(claim => {
            allClaims.add(claim);
        });
        this.roles.forEach(role => {
            this.___loadRoleClaims(role, allClaims);
        });
        return allClaims;
    }

    ___loadRoleClaims(role: Role, allClaims: UniqueArray<Claim>):void {
        role.claims.forEach(claim => {
            allClaims.add(claim);
        });
        role.parents.forEach(parentRole => {
            this.___loadRoleClaims(parentRole, allClaims);
        });
    }

    /**
     * returns textual representation
     */
    toString() {
        return `(${String(this.realm)}, ${this.principalName}, ${String(this.claims)}, ${String(this.roles)})`;
    }
}
