/*@flow*/

import type {Realm}     from './interface';

/**
 * RealmImpl implements Realm for defining domain of the application
 */
export class RealmImpl implements Realm {
    id:         number;         // unique database id
    realmName:  string;         // realm-name

    constructor(theId: number, 
                theRealmName: string) {
        //
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
