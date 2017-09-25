const assert            = require('assert');
const AuditRecord       = require('../domain/audit_record');
const PersistenceError  = require('./persistence_error');

/**
 * AuditRecordRepository defines data access methods for audit-records
 */
class AuditRecordRepository {
    constructor(repositoryLocator, redisClient) {
        this.client = redisClient;
    }

    tableName(realm, name) {
        return `audit_records_${realm}_${name}`;
    }

    /**
     * This method finds audit-records by realm-name and principal-name
     * @param {*} realm - realm-name
     * @param {*} name - principal-name
     * @param {*} min - min range
     * @param {*} max - max range 
     * @return list of audit-records within range
     */
    async findByRange(realm, name, min, max) {
        assert(realm, 'realm-name not specified for audit-record');
        assert(name, 'principal-name not specified for audit-record');
        let table = this.tableName(realm, name);
        return new Promise((resolve, reject) => {
            this.client.lrange(table, min, max, (err, objs) => {
                if (err) {
                    reject(new PersistenceError(`Could not find audit-record with principal-name ${name} due to ${err}`));
                } else {
                    resolve(objs.map(str => {
                        let obj = JSON.parse(str);
                        return new AuditRecord(obj.realm, obj.principalName, obj.type, obj.action, obj.resource);
                    }));
                }
            });
        });
    }

    /**
     * This method saves object and returns updated object
     * @param {*} AuditRecord - to save
     */
    async save(realm, record) {
        assert(realm, 'realm-name not specified for audit-record');
        assert(record, 'audit-record not specified');
        assert(record.principalName, 'principal-name not specified for audit-record');
        let table = this.tableName(realm, record.principalName);
        //
        return new Promise((resolve, reject) => {
            this.client.lpush(table, JSON.stringify(record), (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(record);
                }
            });
        });
    }
}

module.exports = AuditRecordRepository; 
