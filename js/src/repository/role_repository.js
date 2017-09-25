const assert            = require('assert');
const Claim             = require('../domain/claim');
const Role              = require('../domain/role');
const PersistenceError  = require('./persistence_error');
const UniqueArray       = require('../util/unique_array');
const extend            = require('util')._extend;

/**
 * RoleRepository defines data access methods for role objects
*/
class RoleRepository {
    constructor(repositoryLocator, redisClient) {
        this.client = redisClient;
    }

    tableName(realm) {
        return `roles_${realm}`;
    }

    /**
     * This method finds roles by realm-name and role-names
     * @param {*} realm - realm-name
     * @param {*} role-names - role-names
     * @return list of roles
     */
    async findByRoleNames(realm, ...roleNames) {
        assert(realm, 'realm-name not specified');
        assert(roleNames && roleNames.length > 0, 'role-names not specified');  
        roleNames = [].concat.apply([], roleNames);
        let roles = await this.findByRealm(realm);
        return roles.filter(r => roleNames.includes(r.roleName));
    }

    /**
     * This method finds roles by realm-name
     * @param {*} realm - realm-name
     * @return list of roles
     */
    async findByRealm(realm) {
        assert(realm, 'realm-name not specified for role!');
        let table = this.tableName(realm);
        return new Promise((resolve, reject) => {
            this.client.hgetall(table, (err, resp) => {
                if (err) {
                    reject(new PersistenceError(`Could not find roles with realm ${realm} due to ${err}`));
                } else {
                    resolve(this.__populate(resp));
                }
            });
        });
    }


    /**
     * This method saves object and returns updated object
     * @param {*} realm - realm-name
     * @param {*} role - to save
    */
    async save(role) {
        assert(role, 'role not specified');
        assert(role.realm, 'realm-name not specified for role');
        let table = this.tableName(role.realm);
        let toSave = extend({}, role);
        toSave.parents = role.parents.map(p => p.roleName ? p.roleName : p);
        // 
        return new Promise((resolve, reject) => {
            this.client.hmset(table, role.roleName, JSON.stringify(toSave), (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(role);
                }
            });
        });
    }

    /**
     * This method removes role
     * @param {*} role - role to delete
*/
    async remove(role) {
        assert(role, 'role not specified');
        assert(role.realm, `realm-name not specified for role ${role}`);
        let table = this.tableName(role.realm);
        return new Promise((resolve, reject) => {
            this.client.hdel(table, role.roleName, (err) => {
                if (err) {
                    reject(new PersistenceError(`Could not find role with realm ${realm} due to ${err}`));
                } else {
                    resolve(true);
                }
            });
        });
    }

    __populate(resp) {
        let rolesByRoleName = new Map();
        let roles = Object.entries(resp || []).map(([k,v]) => v).filter(v => v != null).map(v => {
            let json = JSON.parse(v);
            let role = Role.parse(json);
            rolesByRoleName.set(role.roleName, role); 
            return role;
        });
        roles.forEach(role => {
            role.parents = role.parents.map(p => rolesByRoleName.get(p)).filter(p => p != null);
        });
        return roles;
    }
}
module.exports = RoleRepository;
