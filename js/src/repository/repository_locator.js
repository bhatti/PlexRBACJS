const redis                     = require('redis');
const bluebird                  = require('bluebird');
const ClaimRepository           = require('./claim_repository');
const PrincipalRepository       = require('./principal_repository');
const RoleRepository            = require('./role_repository');
const AuditRecordRepository     = require('./audit_record_repository');
const LimitsRepository          = require('./limits_repository');

/**
 * RepositoryLocator provides access repositories
*/
class RepositoryLocator {
    constructor(host, port, done) {
        //bluebird.promisifyAll(redis.RedisClient.prototype);
        //bluebird.promisifyAll(redis.Multi.prototype);
        this.client                 = redis.createClient(port, host);
        this.claimRepository        = new ClaimRepository(this, this.client);
        this.auditRecordRepository  = new AuditRecordRepository(this, this.client);
        this.limitsRepository       = new LimitsRepository(this, this.client);
        this.roleRepository         = new RoleRepository(this, this.client);
        this.principalRepository    = new PrincipalRepository(this, this.client);
        done();
    }

    close() {
        this.client.unref();
        this.client = null;
    }
}
module.exports = RepositoryLocator;
