/*@flow*/
var sqlite3 = require('sqlite3').verbose();

import type {Realm}             from '../../domain/interface';
import type {RealmRepository}   from '../interface';
import {QueryOptions}           from '../interface';
import {RealmImpl}              from '../../domain/realm';
import {PersistenceError}       from '../persistence_error';
import {DBHelper}               from './db_helper';
import {QueryHelper}            from './query_helper';

/**
 * RealmRepositorySqlite implements RealmRepository by defining data access 
 * methods for realm objects
 */
export class RealmRepositorySqlite implements RealmRepository {
    dbHelper:   DBHelper;
    sqlPrefix:  string;

    constructor(theDBHelper: DBHelper) {
        this.dbHelper = theDBHelper;
        this.sqlPrefix = 'SELECT rowid AS id, realm_name FROM realms';
    }

    rowToRealm(row: any): Promise<Realm> {
        return Promise.resolve(new RealmImpl(row.id, row.realm_name));
    }

    /**
     * This method finds object by id
     * @param {*} id - database id
     */
    findById(id: number): Promise<Realm> {
        let db = this.dbHelper.db;
        return new Promise((resolve, reject) => {
            db.get(`${this.sqlPrefix} WHERE rowid == ?`, id, (err, row) => {
                if (err) {
                    reject(new PersistenceError(`Could not find realm with id ${id} due to ${err}`));
                } else {
                    this.rowToRealm(row).
                        then(realm => {
                        resolve(realm);
                    });
                }
            });
        });
    }

    /**
     * This method finds realm by name
     * @param {*} realmName
     */
    findByName(realmName: string): Promise<Realm> {
        let db = this.dbHelper.db;
        return new Promise((resolve, reject) => {
            db.get(`${this.sqlPrefix} WHERE realm_name == ?`, realmName, (err, row) => {
                if (err) {
                    reject(new PersistenceError(`Could not find realm with name ${realmName}`));
                } else {
                    this.rowToRealm(row).
                        then(realm => {
                        resolve(realm);
                    });
                }
            });
        });
    }

    /**
     * This method saves object and returns updated object
     * @param {*} realm - to save
     */
    save(realm: Realm): Promise<Realm> {
        if (realm.id) {
            throw new PersistenceError(`Realm is immutable and cannot be updated ${String(realm)}`);
        } else {
            let db = this.dbHelper.db;
            //
            return new Promise((resolve, reject) => {
                let stmt = db.prepare('INSERT INTO realms VALUES (?)');
                stmt.run(realm.realmName);
                stmt.finalize(() => {
                    db.get('SELECT last_insert_rowid() AS lastID', (err, row) => {
                        realm.id = row.lastID;
                        if (err) {
                            reject(new PersistenceError(`Could not add ${String(realm)} due to ${err}`));
                        } else {
                            resolve(realm);
                        }
                    });
                });
            });
        }
    }

    /**
     * This method removes object by id
     * @param {*} id - database id
     */
    removeById(id: number): Promise<boolean> {
        throw new PersistenceError(`Realm is immutable and cannot be deleted ${id}`);
    }

    /**
     * This method queries database and returns list of objects
     */
    search(criteria: Map<string, any>, options?: QueryOptions): Promise<Array<Realm>> {
        let q:QueryHelper<Realm> = new QueryHelper(this.dbHelper.db);
        return q.query(this.sqlPrefix, new Map(), row => {
             return this.rowToRealm(row);
         }, options);
    }
}
