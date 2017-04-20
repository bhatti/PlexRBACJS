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

    startDate:  Date;       // start effective date

    endDate:    Date;       // end effective date

    constructor(theRealm: IRealm,
                theRoleName: string,
                theStartDate:   ?Date,
                theEndDate:     ?Date) {
        //
        assert(theRealm, 'realm is required');
        assert(theRoleName, 'role-name is required');

        this.realm      = theRealm;
        this.roleName   = theRoleName;
        this.startDate  = theStartDate || new Date();
        this.endDate    = theEndDate || new Date(new Date().setFullYear(new Date().getFullYear() + 5));
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
