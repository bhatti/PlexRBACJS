/*@flow*/
var sqlite3 = require('sqlite3').verbose();

import type {Realm}             from '../../domain/interface';
import type {RealmRepository}   from '../interface';
import {QueryOptions}           from '../interface';
import {RealmImpl}              from '../../domain/realm';
import {PersistenceError}       from '../persistence_error';

/**
 * RealmRepositorySqlite implements RealmRepository by defining data access 
 * methods for realm objects
 */
export class RealmRepositorySqlite implements RealmRepository {
    db: sqlite3.Database;
    sqlPrefix:string = 'SELECT rowid AS id, realm_name FROM realms';

    constructor(theDB: sqlite3.Database) {
        this.db = theDB;
    }

    rowToRealm(row: any): Realm {
        return new RealmImpl(row.id, row.realm_name);
    }

    /**
     * This method finds object by id
     * @param {*} id - database id
     */
    findById(id: number): Realm {
        var realm = null;
        //
        this.db.get('${this.sqlPrefix} WHERE rowid == ?', id, (err, row) => {
            return this.rowToRealm(row);
        });
        throw new PersistenceError(`Could not find realm with id ${id}`);
    }

    /**
     * This method finds realm by name
     * @param {*} realmName
     */
    findByName(realmName: string): Realm {
        var principal = null;
        //
        this.db.get('${this.sqlPrefix} WHERE realm_name == ?', realmName, (err, row) => {
            return this.rowToRealm(row);
        });
        throw new PersistenceError(`Could not find realm with name ${realmName}`);
    }

    /**
     * This method saves object and returns updated object
     * @param {*} realm - to save
     */
    save(realm: Realm): Realm {
        if (realm.id) {
            throw new PersistenceError(`Realm is immutable and cannot be updated ${String(realm)}`);
        } else {
            this.db.run('INSERT INTO realms VALUES (?)', realm.realmName, function(err) {
                if (err) {
                    throw new PersistenceError(`Could not save realm ${String(realm)} due to ${err}`);
                } else {
                    realm.id = this.lastID;
                }
            });
        }
        return realm;
    }

    /**
     * This method removes object by id
     * @param {*} id - database id
     */
    removeById(id: number): boolean {
        throw new PersistenceError(`Realm is immutable and cannot be deleted ${id}`);
    }

    /**
     * This method queries database and returns list of objects
     */
    search(criteria: Map<string, any>, options?: QueryOptions): Array<Realm> {
         return this.db.query(this.sqlPrefix, (row) => {
             return this.rowToRealm(row);
         });
    }
}
