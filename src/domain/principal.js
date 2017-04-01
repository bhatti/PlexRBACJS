/*@flow*/

import type {Principal, Claim, Role, Realm}     from './interface';

export class PrincipalImpl implements Principal {
    /**
     * unique database id
     */
    id: number;

    /**
     * principal name such as username
     */
    principalName: string;

    /**
     * realm for this principal
     */
    realm: Realm;

    /**
     * set of Claims
     */
    claims: Set<Claim>;

    /**
     * set of roles
     */
    roles: Set<Role>;

    constructor() {
    }

    constructor(theId: number, 
                theRealm: Realm, 
                thePrincipalName: string) {
        //
        this.id = theId;
        this.realm = theRealm;
        this.principalName = thePrincipalName;
        this.claims = new Set();
        this.roles = new Set();
    }

    allClaims(): Set<Claim> {
        let allClaims: Set<Claim> = new Set();
        this.claims.forEach(claim => {
            allClaims.add(claim);
        });
        this.roles.forEach(role => {
            this._loadRoleClaims(role, allClaims);
        });
        return allClaims;
    }

    _loadRoleClaims(role: Role, allClaims: Set<Claim>):void {
        role.claims.forEach(claim => {
            allClaims.add(claim);
        });
        if (role.parent != null) {
            this._loadRoleClaims(role.parent, allClaims);
        }
    }

    /**
     * returns textual representation
     */
    toString() {
        return `(${String(this.realm)}, ${this.principalName}, ${String(this.claims)}, ${String(this.roles)})`;
    }    
}