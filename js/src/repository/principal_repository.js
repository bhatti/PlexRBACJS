const assert            = require('assert');
const Claim             = require('../domain/claim');
const Limits            = require('../domain/limits');
const Principal         = require('../domain/principal');
const PersistenceError  = require('./persistence_error');
const UniqueArray       = require('../util/unique_array');
const extend            = require('util')._extend;

/**
 * PrincipalRepository defines data access methods for principal objects
*/
class PrincipalRepository {
    constructor(repositoryLocator, redisClient) {
        this.roleRepository = repositoryLocator.roleRepository;
        this.client = redisClient;
    }

    tableName(realm) {
        return `principal_${realm}`;
    }

    usageCounter(principal, limits) {
        return `limits_counter_${principal.realm}_${principal.principalName}_${limits.uniqueKey()}`;
    }

    /**
     * This method finds principal by realm and principal-name 
     * @param {*} realm - realm-name
     * @param {*} principalName - principal-name
     * @return principal or null
    */
    async findByPrincipalName(realm, name) {
        assert(realm, 'realm-name not specified for principal in find');
        assert(name, 'principal-name not specified'); 

        let table = this.tableName(realm);
        return new Promise((resolve, reject) => {
            this.client.hget(table, name, async (err, resp) => {
                if (err) {
                    reject(new PersistenceError(`Could not find principal for realm ${realm} principal-name ${name} due to ${err}`));
                } else if (resp != null) {
                    this.__populate(resp, resolve, reject); 
                } else {
                    resolve(null);
                }
            });
        });
    } 

    /**
     * This method finds principals by realm-name
     * @param {*} realm - realm-name
     * @return list of principals
    */
    async findByRealm(realm) {
        assert(realm, 'realm-name not specified!');
        let table = this.tableName(realm);
        return new Promise((resolve, reject) => {
            this.client.hgetall(table, (err, resp) => {
                if (err) {
                    reject(new PersistenceError(`Could not find roles with realm ${realm} due to ${err}`));
                } else {
                    let principals = new UniqueArray();
                    let strArr = Object.entries(resp || []).map(([k,v]) => v).filter(v => v != null);
                    for (var i=0; i<strArr.length; i++) {
                        let ndx = i;
                        this.__populate(strArr[i], (principal) => {
                            principals.add(principal);
                            if (ndx == strArr.length-1) {
                                resolve(principals);
                            }
                        }, (e) => {
                            reject(`Found error ${e} when populating ${v}`);
                        });
                    };
                }
            });
        });
    }


    /**
     * This method saves object and returns updated object
     * @param {*} principal - to save
    */
    async save(principal) {
        assert(principal, 'principal not specified');
        assert(principal.realm, 'realm-name not specified for principal in save');
        let table = this.tableName(principal.realm);
        //
        const toSave        = extend({}, principal);
        toSave.roles        = principal.roles.map(r => r.roleName);
        //  
        return new Promise((resolve, reject) => {
            this.client.hmset(table, principal.principalName, JSON.stringify(toSave), (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(principal);
                }
            });
        });
    }

    /**
     * This method removes object by principal-name
     * @param {*} principal - to remove
    */
    async remove(principal) {
        assert(principal, 'principal not specified');
        assert(principal.realm, 'realm-name not specified for principal in remove');
        let table = this.tableName(principal.realm); 

        return new Promise((resolve, reject) => {
            this.client.hdel(table, principal.principalName, (err) => {
                if (err) {
                    reject(new PersistenceError(`Could not find principal with principal-name ${principal.principalName} due to ${err}`));
                } else {
                    resolve(true);
                }
            });
        });
    }


    /**
     * This method increments usage count object and returns updated object
     * @param {*} realm - realm-name
     * @param {*} name - principal-name
    */
    async increment(principal, type, resource) {
        assert(principal, 'principal not specified');
        assert(principal.realm, 'realm-name not specified for principal in increment');
        assert(type, 'limits-type not specified');
        assert(resource, 'limits-resource not specified');
        principal = await this.findByPrincipalName(principal.realm, principal.principalName);
        if (principal == null) {
            return null;
        }
        let matchingLimits = principal.limits.filter(l => l.type == type && l.resource == resource);
        if (matchingLimits.length == 0) {
            return null;
        }
        let limits = matchingLimits[0];
        assert(limits.value < limits.maxAllowed, `already reached max limit ${limits.value} >= ${limits.maxAllowed}`);
        let counter = this.usageCounter(principal, limits);
        return new Promise((resolve, reject) => {
            this.client.incr(counter, (err, resp) => {
                if (err) {
                    reject(err);
                } else {
                    limits.value = resp;
                    if (limits.value > limits.maxAllowed) {
                        reject(`already reached max limit ${limits.value} >= ${limits.maxAllowed}`);
                    } else {
                        resolve(limits);
                    }
                }
            });
        });
    }

    __populate(resp, gResolve, gReject) {
        let json = JSON.parse(resp);
        let principal = Principal.parse(json);
        
        let promises = [];
        if (principal.limits.length > 0) {
            promises.push(new Promise((resolve, reject) => {
                let keys = principal.limits.map(l => this.usageCounter(principal, l));
                this.client.mget(keys, (err, resp) => {
                    if (err) {
                        reject(err);
                    } else {
                        for (var i=0; i<principal.limits.length; i++) {
                            principal.limits[i].value = resp[i] || 0;
                        }
                        resolve(principal);
                    };
                });
            }));
        }
        //
        promises.push(this.roleRepository.findByRoleNames(principal.realm, json.roles).
                then(roles => principal.roles = roles));
        return Promise.all(promises).then(_ => gResolve(principal)).catch(e => gReject(e));
    }
}
module.exports = PrincipalRepository;
