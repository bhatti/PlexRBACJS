/*@flow*/

import type {Realm}             from './interface';
import type {UniqueIdentifier}  from '../util/unique_id';

const assert = require('assert');


/**
 * RealmImpl implements Realm for defining domain of the application
 */
export class RealmImpl implements Realm, UniqueIdentifier {
    id:         number;         // unique database id
    realmName:  string;         // realm-name

    constructor(theRealmName: string) {
        //
        assert(theRealmName, 'realm is required');
        this.realmName = theRealmName;
    }

    uniqueKey(): string {
        return `${this.realmName}`;
    }

    /**
     * returns textual representation
     */
    toString() {
        return `(${this.realmName})`;
    }
}
