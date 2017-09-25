/*@flow*/

const assert = require('assert');

import type {IRealm}            from '../../domain/interface';
import type {IPrincipal}        from '../../domain/interface';
import type {ILimit}            from '../../domain/interface';
import type {LimitRepository}   from '../interface';
import type {RealmRepository}   from '../interface';
import {QueryOptions}           from '../interface';
import {Limit}                  from '../../domain/limit';
import {Principal}              from '../../domain/principal';
import {Realm}                  from '../../domain/realm';
import {PersistenceError}       from '../persistence_error';
import {DBFactory}              from './db_factory';
import {QueryHelper}            from './query_helper';

/**
 * AuditRecordRepositorySqlite implements AuditRecordRepository by defining data access methods for audit-records
 */
export class LimitRepositorySqlite implements LimitRepository {
    dbFactory:          DBFactory;
    realmRepository:    RealmRepository;
    sqlPrefix:          string;


    constructor(theDBFactory: DBFactory, theRealmRepository: RealmRepository) {
        assert(theDBFactory, 'db-helper not specified');
        assert(theRealmRepository, 'realm-repository not specified');

        this.dbFactory          = theDBFactory;
        this.realmRepository    = theRealmRepository;
        this.sqlPrefix          = 'SELECT rowid AS id, principal_id, type, resource, max_allowed, value, expiration_date FROM limits';
    }

    /**
     * This method finds object by id
     * @param {*} id - database id
     */
    async findById(id: number): Promise<ILimit> {
        assert(id, 'limit-id not specified');
        let findPromise = new Promise((resolve, reject) => {
            this.dbFactory.db.get(`${this.sqlPrefix} WHERE rowid == ?`, id, (err, row) => {
                if (err) {
                    reject(new PersistenceError(`Could not find limit with id ${id} due to ${err}`));
                } else if (row) {
                    return this.__rowToLimit(row).
                    then(record => {
                        resolve(record);
                    }).catch(err => {
                        reject(new PersistenceError(`Could not find limit with id ${id} due to ${err}`));
                    });
                } else {
                    reject(new PersistenceError(`Could not find limit with id ${id}`));
                }
            });
        });
        return await findPromise;
    }

    /**
     * This method saves object and returns updated object
     * @param {*} limit - to save
     */
    async save(limit: ILimit): Promise<ILimit> {
        assert(limit, 'limit not specified');
        assert(limit.principal && limit.principal.id, `principal-id for limit not specified ${String(limit.principal)}`);
        //
        return new Promise((resolve, reject) => {
            if (limit.id) {
                let stmt = this.dbFactory.db.prepare('UPDATE limits SET max_allowed = ?, value = ?, expiration_date = ? WHERE rowid = ?');
                stmt.run(limit.maxAllowed, limit.value,  limit.expirationISODate(), limit.id);
                stmt.finalize(err => {
                    if (err) {
                        reject(new PersistenceError(`Could not save limit ${JSON.stringify(limit)} due to ${err}`));
                    } else {
                        resolve(limit);
                    }
                });
            } else {
                let stmt = this.dbFactory.db.prepare('INSERT INTO limits (principal_id, type, resource, max_allowed, value, expiration_date) VALUES (?, ?, ?, ?, ?, ?)');
                stmt.run(limit.principal.id, limit.type, limit.resource, limit.maxAllowed, limit.value, limit.expirationISODate(), function(err) {
                    limit.id = this.lastID;
                });
                stmt.finalize((err) => {
                    if (err) {
                        reject(new PersistenceError(`Could not insert limit ${JSON.stringify(limit)} due to ${err}`));
                    } else {
                        resolve(limit);
                    }
                });
            }
        });
    }

    /**
     * This method removes object by id
     * @param {*} id - database id
     */
    async removeById(id: number): Promise<boolean> {
        return new Promise((resolve, reject) => {
                  this.dbFactory.db.run('DELETE FROM limits WHERE rowid = ?', id, (err) => {
                        if (err) {
                            reject(new PersistenceError(`Failed to delete limit with id ${id}`));
                        } else {
                            resolve(true);
                        }
                  });
            });
    }

    async search(criteria: Map<string, any>, options?: QueryOptions): Promise<Array<ILimit>> {
        let q:QueryHelper<ILimit> = new QueryHelper(this.dbFactory.db);
        return q.query(this.sqlPrefix, criteria, (row) => {
            return this.__rowToLimit(row);
         }, options);
    }

    /**
     * This method save limit for principal
     */
    async __savePrincipalLimits(principal: IPrincipal): Promise<IPrincipal> {
        assert(principal && principal.id, 'principal-id for limit not specified');
        principal.limits.forEach(limit => {
            limit.principal = principal;
            this.save(limit);
        });
        return principal;
    }

    /**
     * This method loads limits for given principal using limits associated with role and principal
     */
    async __loadPrincipalLimits(principal: IPrincipal): Promise<IPrincipal> {
        assert(principal && principal.id, 'principal-id for limit not specified');

        let criteria    = new Map();
        criteria.set('principal_id', principal.id);
        principal.limits = await this.search(criteria);
        principal.limits.forEach( act => {
            act.principal = principal;
        });
        return principal;
    }


    /**
     * This method increments usage count object and returns updated object
     * @param {*} audit-record - to save
     */
    async increment(id: number): Promise<?ILimit> {
        let limit = await this.findById(id);
        if (limit == null) {
            return null;
        }
        assert(limit.value < limit.maxAllowed, `already reached max limit ${limit.value} >= ${limit.maxAllowed}`);
        limit.value += 1;
        return this.save(limit);
    }

    async __rowToLimit(row: any): Promise<ILimit> {
        let record = new Limit(row.type, row.resource, row.max_allowed, row.value);
        record.expirationDate = new Date(Date.parse(row.expiration_date));
        let realm = new Realm('undefined');
        realm.id = -1;
        record.principal = new Principal(realm, 'undefined');
        record.principal.id = row.principal_id;
        record.id = row.id;
        return record;
    }
}
