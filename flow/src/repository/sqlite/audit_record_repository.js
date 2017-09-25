/*@flow*/

const assert = require('assert');

import type {IAuditRecord}      from '../../domain/interface';
import type {AuditRecordRepository}   from '../interface';
import type {RealmRepository}   from '../interface';
import {QueryOptions}           from '../interface';
import {AuditRecord}                  from '../../domain/audit_record';
import {PersistenceError}       from '../persistence_error';
import {DBFactory}              from './db_factory';
import {QueryHelper}            from './query_helper';

/**
 * AuditRecordRepositorySqlite implements AuditRecordRepository by defining data access methods for audit-records
 */
export class AuditRecordRepositorySqlite implements AuditRecordRepository {
    dbFactory:          DBFactory;
    realmRepository:    RealmRepository;
    sqlPrefix:          string;


    constructor(theDBFactory: DBFactory, theRealmRepository: RealmRepository) {
        assert(theDBFactory, 'db-helper not specified');
        assert(theRealmRepository, 'realm-repository not specified');

        this.dbFactory          = theDBFactory;
        this.realmRepository    = theRealmRepository;
        this.sqlPrefix          = 'SELECT rowid AS id, realm_id, principal_name, type, action, resource FROM audit_records';
    }

    /**
     * This method finds object by id
     * @param {*} id - database id
     */
    async findById(id: number): Promise<IAuditRecord> {
        assert(id, 'audit-record-id not specified');
        let findPromise = new Promise((resolve, reject) => {
            this.dbFactory.db.get(`${this.sqlPrefix} WHERE rowid == ?`, id, (err, row) => {
                if (err) {
                    reject(new PersistenceError(`Could not find audit-record with id ${id} due to ${err}`));
                } else if (row) {
                    return this.__rowToAuditRecord(row).
                    then(record => {
                        resolve(record);
                    }).catch(err => {
                        reject(new PersistenceError(`Could not find audit-record with id ${id} due to ${err}`));
                    });
                } else {
                    reject(new PersistenceError(`Could not find audit-record with id ${id}`));
                }
            });
        });
        return await findPromise;
    }

    /**
     * This method saves object and returns updated object
     * @param {*} AuditRecord - to save
     */
    async save(record: IAuditRecord): Promise<IAuditRecord> {
        assert(record, 'audit-record not specified');
        assert(record.realm() && record.realm().id, 'realm-id for audit-record not specified');
        //
        return new Promise((resolve, reject) => {
            let stmt = this.dbFactory.db.prepare('INSERT INTO audit_records (realm_id, principal_name, type, action, resource) VALUES (?, ?, ?, ?, ?)');
            stmt.run(record.realm().id, record.principalName, record.type, record.action, record.resource, function(err) {
                record.id = this.lastID;
            });
            stmt.finalize((err) => {
                if (err) {
                    reject(new PersistenceError(`Could not insert audit-record ${JSON.stringify(record)} due to ${err}`));
                } else {
                    resolve(record);
                }
            });
        });
    }

    /**
     * This method removes object by id
     * @param {*} id - database id
     */
    async removeById(id: number): Promise<boolean> {
        return Promise.reject('unsupported method');
    }


    /**
     * This method queries database and returns list of objects
     */
    async search(criteria: Map<string, any>, options?: QueryOptions): Promise<Array<IAuditRecord>> {
        let q:QueryHelper<IAuditRecord> = new QueryHelper(this.dbFactory.db);
        return q.query(this.sqlPrefix, criteria, (row) => {
            return this.__rowToAuditRecord(row);
         }, options);
    }

    async __rowToAuditRecord(row: any): Promise<IAuditRecord> {
        let promise     = this.realmRepository.findById(row.realm_id);
        let realm       = await promise;
        assert(realm && realm.id, 'realm-id not specified');
        let record = new AuditRecord(realm, row.principal_name, row.type, row.action, row.resource);
        record.id = row.id;
        return record;
    }
}
