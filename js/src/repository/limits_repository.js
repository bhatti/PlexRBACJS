const assert            = require('assert');
const Limits            = require('../domain/limits');
const PersistenceError  = require('./persistence_error');
const extend            = require('util')._extend;

/**
 * LimitsRepository defines data access methods for usage limits
 */
class LimitsRepository {
    constructor(repositoryLocator, redisClient) {
        this.client = redisClient;
    }

    tableName(realm) {
        return `limits_${realm}`;
    }

    /**
     * This method finds limit records by realm
     * @param {*} realm - realm-name 
     * @return list of limits
     */
    async findByRealm(realm) {
        assert(realm, 'realm-name not specified for limits');
        let table = this.tableName(realm);
        return new Promise((resolve, reject) => {
            this.client.hgetall(table, (err, limits) => {
                if (err) {
                    reject(new PersistenceError(`Could not find limit with realm ${realm} due to ${err}`));
                } else {
                    resolve(Object.entries(limits || []).map(([k,v]) => {
                        let obj = JSON.parse(v); 
                        return new Limits(obj.type, obj.resource, obj.maxAllowed, 0, null);
                    }));
                }
            });
        });
    }

    /**
     * This method saves object and returns updated object
     * @param {*} realm - realm-name
     * @param {*} limit - to save
     */
    async save(realm, limit) {
        assert(realm, 'realm-name not specified for limits');
        assert(limit, 'limit not specified');
        let table               = this.tableName(realm);
        let key                 = limit.uniqueKey();
        let toSave              = extend({}, limit);
        toSave.value              = 0;
        toSave.expirationDate    = null;
        //
        return new Promise((resolve, reject) => {
            this.client.hmset(table, key, JSON.stringify(toSave), (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(limit);
                }
            });
        });
    }

    /**
     * This method removes object by principal-name
     * @param {*} realm - realm-name
     * @param {*} limit - to remove
     */
    async remove(realm, limit) {
        assert(realm, 'realm-name not specified for limits');
        let table = this.tableName(realm);
        let key                 = limit.uniqueKey();
        return new Promise((resolve, reject) => {
            this.client.hdel(table, key, (err) => {
                if (err) {
                    reject(new PersistenceError(`Could not remove limit with realm-name ${realm} and key ${key} due to ${err}`));
                } else {
                    resolve(true);
                }
            });
        });
    }
}
module.exports = LimitsRepository;
