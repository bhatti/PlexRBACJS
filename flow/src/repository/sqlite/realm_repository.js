/*@flow*/
const sqlite3   = require('sqlite3').verbose();
const assert    = require('assert');

import type {IRealm}            from '../../domain/interface';
import type {RealmRepository}   from '../interface';
import {QueryOptions}           from '../interface';
import {Realm}                  from '../../domain/realm';
import {PersistenceError}       from '../persistence_error';
import {DBFactory}              from './db_factory';
import {QueryHelper}            from './query_helper';
import type {SecurityCache}     from '../../cache/interface';

/**
 * RealmRepositorySqlite implements RealmRepository by defining data access
 * methods for realm objects
 */
export class RealmRepositorySqlite implements RealmRepository {
	dbFactory:  DBFactory;
	sqlPrefix:  string;
	cache:      SecurityCache;

	constructor(theDBFactory: DBFactory, theCache: SecurityCache) {
		assert(theDBFactory, 'db-helper not specified');
		assert(theCache, 'cache not specified');
		this.dbFactory  = theDBFactory;
		this.cache      = theCache;
		this.sqlPrefix  = 'SELECT rowid AS id, realm_name FROM realms';
	}

	/**
	 * This method finds object by id
	 * @param {*} id - database id
	 */
	async findById(id: number): Promise<IRealm> {
		assert(id, 'realm-id not specified');

		let cached = this.cache.get('realm', `id_${id}`);
		if (cached) {
			return Promise.resolve(cached);
		}
		//
		let db = this.dbFactory.db;
		return new Promise((resolve, reject) => {
			db.get(`${this.sqlPrefix} WHERE rowid == ?`, id, (err, row) => {
				if (err) {
					reject(new PersistenceError(`Could not find realm with id ${id} due to ${err}`));
				} else if (row) {
					this.__rowToRealm(row).
						then(realm => {
						this.cache.set('realm', `id_${id}`, realm);
						resolve(realm);
					}).catch(err => {
						reject(err);
					});
				} else {
					reject(new PersistenceError(`Could not find realm with id ${id}`));
				}
			});
		});
	}

	/**
	 * This method finds realm by name
	 * @param {*} realmName
	 */
	async findByName(realmName: string): Promise<IRealm> {
		assert(realmName, 'realm-name not specified');

		let cached = this.cache.get('realm', realmName);
		if (cached) {
			return cached;
		}

		return new Promise((resolve, reject) => {
			this.dbFactory.db.get(`${this.sqlPrefix} WHERE realm_name == ?`, realmName, (err, row) => {
				if (err) {
					reject(new PersistenceError(`Could not find realm with name ${realmName}`));
				} else if (row) {
					this.__rowToRealm(row).
						then(realm => {
						this.cache.set('realm', realmName, realm);
						resolve(realm);
					}).catch(err => {
						reject(err);
					});
				} else {
					reject(new PersistenceError(`Could not find realm with name ${realmName}`));
				}
			});
		});
	}

	/**
	 * This method saves object and returns updated object
	 * @param {*} realm - to save
	 */
	async save(realm: IRealm): Promise<IRealm> {
		assert(realm, 'realm not specified');

		let loaded = null;
		if (!realm.id) {
			try {
				loaded = await this.findByName(realm.realmName);
				if (loaded) {
					realm.id = loaded.id;
				}
			} catch (err) {
			}
		}

		if (realm.id) {
			return Promise.resolve(realm);
		} else {
			//
			return new Promise((resolve, reject) => {
				let stmt = this.dbFactory.db.prepare('INSERT INTO realms (realm_name) VALUES (?)');
				stmt.run(realm.realmName, function(err) {
					realm.id = this.lastID;
				});
				stmt.finalize((err) => {
					if (err) {
						reject(new PersistenceError(`Could not add ${String(realm)} due to ${err}`));
					} else {
						this.cache.set('realm', `id_${realm.id}`, realm);
						this.cache.set('realm', realm.realmName, realm);
						resolve(realm);
					}
				});
			});
		}
	}

	/**
	 * This method removes object by id
	 * @param {*} id - database id
	 */
	async removeById(id: number): Promise<boolean> {
		throw new PersistenceError(`Realm is immutable and cannot be deleted ${id}`);
	}

	/**
	 * This method queries database and returns list of objects
	 a*/
	async search(criteria: Map<string, any>, options?: QueryOptions): Promise<Array<IRealm>> {
		let q:QueryHelper<Realm> = new QueryHelper(this.dbFactory.db);
		return q.query(this.sqlPrefix, criteria, row => {
			 return this.__rowToRealm(row);
		 }, options);
	}

	async __rowToRealm(row: any): Promise<IRealm> {
		let realm = new Realm(row.realm_name);
		realm.id = row.id;
		return realm;
	}

}
