/*@flow*/

import type {Claim, Role, Realm}   from './interface';
import {UniqueArray}               from '../util/unique_array';
import type {UniqueIdentifier}     from '../util/unique_id';

const assert = require('assert');


/**
 * RoleImpl implements Role for defining function or job
 */
export class RoleImpl implements Role, UniqueIdentifier {
    id:         number;         // unique database id

    realm:      Realm;          // realm for the application

    roleName:   string;         // role-name

    claims:     UniqueArray<Claim>;     // set of claims

    parents:    UniqueArray<Role>;      // optional parent role

    constructor(theRealm: Realm,
                theRoleName: string) {
        //
        assert(theRealm, 'realm is required');
        assert(theRoleName, 'role-name is required');

        this.realm      = theRealm;
        this.roleName   = theRoleName;
        this.claims     = new UniqueArray();
        this.parents    = new UniqueArray();
    }

    uniqueKey(): string {
        return `${this.realm.realmName}_${this.roleName}`;
    }

    /**
     * returns textual representation
     */
    toString() {
        return `(${String(this.realm)}, ${this.roleName}), claims ${String(this.claims)}`;
    }
}
