/*@flow*/

import type {IClaim, IRole, IRealm} from './interface';
import {UniqueArray}                from '../util/unique_array';
import type {UniqueIdentifier}      from '../util/unique_id';

const assert        = require('assert');

const _realm        = Symbol('realm');
const _startDate    = Symbol('startDate');
const _endDate      = Symbol('endDate');


/**
 * Role implements Role for defining function or job
 */
export class Role implements IRole, UniqueIdentifier {
    id:         number;         // unique database id

    roleName:   string;         // role-name

    claims:     UniqueArray<IClaim>;     // set of claims

    parents:    UniqueArray<IRole>;      // optional parent role

    constructor(theRealm: IRealm,
                theRoleName: string,
                theStartDate:   ?Date,
                theEndDate:     ?Date) {
        //
        assert(theRealm, 'realm is required');
        assert(theRoleName, 'role-name is required');
        assert(theRealm.id, 'realm-id not specified');

        this.roleName          = theRoleName;
        this.claims            = new UniqueArray();
        this.parents           = new UniqueArray();
        (this: any)[_realm]    = theRealm;
        (this: any)[_startDate]= theStartDate || new Date();
        (this: any)[_endDate]  = theEndDate || new Date(new Date().setFullYear(new Date().getFullYear() + 5));
    }

    realm(): IRealm {
        return (this: any)[_realm];
    }

    startDate(): string {
        return (this: any)[_startDate].toISOString().split('T')[0];
    }

    endDate(): string {
        return (this: any)[_endDate].toISOString().split('T')[0];
    }

    uniqueKey(): string {
        return `${this.realm().realmName}_${this.roleName}`;
    }

    /**
     * returns textual representation
     */
    toString() {
        return `(${this.id}, ${this.roleName}), claims ${String(this.claims)}`;
    }
}
