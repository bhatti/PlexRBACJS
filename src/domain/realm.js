/*@flow*/

import type {Realm}     from './interface';
const assert = require('assert');


/**
 * RealmImpl implements Realm for defining domain of the application
 */
export class RealmImpl implements Realm {
    id:         number;         // unique database id
    realmName:  string;         // realm-name

    constructor(theId: number, 
                theRealmName: string) {
        //
        assert(theRealmName, 'realm is required');
        this.id = theId;
        this.realmName = theRealmName;
    }

    /**
     * returns textual representation
     */
    toString() {
        return `(${this.realmName})`;
    }        
}
