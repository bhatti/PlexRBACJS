const assert            = require('assert');
const Claim             = require('../domain/claim');
const PersistenceError  = require('./persistence_error');
const extend            = require('util')._extend;


/**
 * ClaimRepository defines data access methods for Claim objects
*/
class ClaimRepository {
    constructor(repositoryLocator, redisClient) {
        this.client = redisClient;
    }

    tableName(realm) {
        return `claims_${realm}`;
    }

    /**
     * This method finds claims by realm-name and unique-keys
     * @param {*} realm - realm-name 
     * @param {*} keys - unique keys
     * @return map of claim-key and claim
*/
    async findByKeys(realm, ...keys) {
        assert(realm, 'realm-name not specified for claim');
        assert(keys, 'keys not specified for claim');
        let table = this.tableName(realm);
        return new Promise((resolve, reject) => {
            this.client.hmget(table, keys, (err, claims) => {
                if (err) {
                    reject(new PersistenceError(`Could not find claims with realm ${realm} and keys ${keys} due to ${err}`));
                } else {
                    resolve(this.__populate(claims)); 
                }
            });
        });
    }

    /**
     * This method finds claims by realm-name
     * @param {*} realm - realm-name 
     * @return list of claims
*/
    async findByRealm(realm) {
        assert(realm, 'realm-name not specified for claim');
        let table = this.tableName(realm);
        return new Promise((resolve, reject) => {
            this.client.hgetall(table, (err, claims) => {
                if (err) {
                    reject(new PersistenceError(`Could not find claims with realm ${realm} due to ${err}`));
                } else {
                    resolve(this.__populate(claims)); 
                }
            });
        });
    }

    /**
     * This method saves object and returns updated object
     * @param {*} realm - realm-name
     * @param {*} claim - to save
*/
    async save(claim) {
        assert(claim, 'claim not specified');
        assert(claim.realm, 'realm-name not specified for claim');
        let table               = this.tableName(claim.realm);
        let key                 = claim.uniqueKey();
        let toSave              = extend({}, claim);
        toSave.startDate        = null;
        toSave.endDate          = null;
        //
        return new Promise((resolve, reject) => {
            this.client.hmset(table, key, JSON.stringify(toSave), (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(claim);
                }
            });
        });
    }

    /**
     * This method removes object by principal-name
     * @param {*} realm - realm-name
     * @param {*} claim - claim to delete
*/
    async remove(claim) {
        assert(claim, 'claim not specified');
        assert(claim.realm, 'realm-name not specified for claim');
        let table = this.tableName(claim.realm);
        return new Promise((resolve, reject) => {
            this.client.hdel(table, claim.uniqueKey(), (err) => {
                if (err) {
                    reject(new PersistenceError(`Could not remove claim with realm ${realm} due to ${err}`));
                } else {
                    resolve(true);
                }
            });
        });
    }

    __populate(arr) {
        return Object.entries(arr || []).reduce((list, [k,v]) => {
            if (v != null) {
                let obj = JSON.parse(v); 
                list.push(new Claim(obj.realm, obj.action, obj.resource, obj.condition, null, null));
            }
            return list;
        }, []);
    }
}
module.exports = ClaimRepository;
