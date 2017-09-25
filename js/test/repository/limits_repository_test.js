var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);

const Limits            = require('../../src/domain/limits');
const LimitsRepository  = require('../../src/repository/limits_repository');
const PersistenceError  = require('./../../src/repository/persistence_error');
const RepositoryLocator = require('../../src/repository/repository_locator');

describe('LimitsRepository', function() {
    before(function(done) {
        this.repositoryLocator = new RepositoryLocator('localhost', 6379, done);
    });

    after(function(done) {
        this.repositoryLocator.close();
        done();
    });

    describe('#find', function() {
        it('should not be able to get limits without saving', async function() {
            let limits = await this.repositoryLocator.limitsRepository.findByRealm('realm');
            assert.equal(0, limits.length);
        });
    });

    describe('#saveGetById', function() {
        it('should be able to get limit after saving', async function() {
            let realm = `save_realm_${new Date().toISOString()}`;
            let limit = new Limits('type', 'resource', 10, 1, null);
            await this.repositoryLocator.limitsRepository.save(realm, limit);
            let all = await this.repositoryLocator.limitsRepository.findByRealm(realm);
            assert.equal(1, all.length);
            let loaded = all[0];
            assert(loaded != null);
            assert.equal('type', loaded.type);
            assert.equal('resource', loaded.resource);
            assert.equal(10, loaded.maxAllowed);
            assert.equal(0, loaded.value);
        });
    });


    describe('#remove', function() {
        it('should be able to remove limits by realm', async function() {
            let realm   = `remove_realm_${new Date().toISOString()}`;
            let limit1       = await this.repositoryLocator.limitsRepository.save(realm, new Limits('type', 'file', 10, 1, null));
            let limit2       = await this.repositoryLocator.limitsRepository.save(realm, new Limits('type', 'memory', 10, 1, null));
            let removed = await this.repositoryLocator.limitsRepository.remove(realm, limit1);
            assert.equal(true, removed);
            let limits = await this.repositoryLocator.limitsRepository.findByRealm(realm);
            assert.equal(1, limits.length);
        });
    });


});
