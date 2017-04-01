/*@flow*/

import type {Claim, Role, Realm}   from './interface';

/**
 * RoleImpl implements Role for defining function or job
 */
export class RoleImpl implements Role {
    id: number;         // unique database id

    realm: Realm;       // realm for the application

    roleName: string;   // role-name

    claims: Set<Claim>; // set of claims

    parent: Role;       // optional parent role
    
    constructor() {
    }

    constructor(theId: number, 
                theRealm: Realm,
                theRoleName: string,
                theParent: Role) {
        //
        this.id = theId;
        this.realm = theRealm;
        this.roleName = theRoleName;
        this.parent = theParent;
        this.claims = new Set();
    }

    /**
     * returns textual representation
     */
    toString() {
        return `(${String(this.realm)}, ${this.roleName})`;
    }            
}