/*@flow*/

import type {ILimit, IRealm, IPrincipal}    from './interface';
import type {UniqueIdentifier}  from '../util/unique_id';

const assert        = require('assert');

const _realm        = Symbol('realm');

/**
 * Limit tracks resource usage by principal
 */
export class Limit implements ILimit, UniqueIdentifier {
    id:         number;  // unique database id

    type: string;

    resource: string;

    maxAllowed: number;

    value: number;

    expirationDate: Date;

    principal: IPrincipal;

    constructor(theType:        string,
                theResource:    string,
                theMaxLimit:    number,
                theUsed:        number,
                theExpirationDate:     ?Date) {
        //
        assert(theType, 'type is required');
        assert(theResource, 'resource is required');
        //
        this.type       = theType;
        this.resource   = theResource;
        this.maxAllowed = theMaxLimit;
        this.value      = theUsed || 0;
        this.expirationDate   = theExpirationDate || new Date(new Date().setFullYear(new Date().getFullYear() + 50));
    }

    uniqueKey(): string {
        return `${this.principal.id}_${this.type}_${this.resource}_${this.id}`;
    }

    expirationISODate(): string {
        return this.expirationDate.toISOString().split('T')[0] + 'T23:59:59';
    }

    valid(): boolean {
        return this.value <= this.maxAllowed && Date.parse(this.expirationISODate()) >= new Date().getTime();
    }
}
