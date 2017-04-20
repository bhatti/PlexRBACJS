/*@flow*/

import type {IClaim, IRole, IRealm} from './interface';
import {UniqueArray}                from '../util/unique_array';
import type {UniqueIdentifier}      from '../util/unique_id';

const assert = require('assert');


/**
 * Role implements Role for defining function or job
 */
export class Role implements IRole, UniqueIdentifier {
    id:         number;         // unique database id

    realm:      IRealm;         // realm for the application

    roleName:   string;         // role-name

    claims:     UniqueArray<IClaim>;     // set of claims

    parents:    UniqueArray<IRole>;      // optional parent role

    constructor(theRealm: IRealm,
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
