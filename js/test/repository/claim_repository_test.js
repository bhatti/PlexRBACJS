var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);

const Claim            = require('../../src/domain/claim');
const ClaimRepository  = require('../../src/repository/claim_repository');
const PersistenceError  = require('./../../src/repository/persistence_error');
const RepositoryLocator = require('../../src/repository/repository_locator');

describe('ClaimRepository', function() {
    before(function(done) {
        this.repositoryLocator = new RepositoryLocator('localhost', 6379, done);
    });

    after(function(done) {
        this.repositoryLocator.close();
        done();
    });

    describe('#find', function() {
        it('should not be able to get claim by id without saving', async function() {
            let realm   = `unknown_realm_${new Date().toISOString()}`;
            let claims = await this.repositoryLocator.claimRepository.findByKeys(realm, 'non-existing-key1');
            assert.equal(0, claims.length);
        });
    });

    describe('#saveAndFind', function() {
        it('should be able to get claim by id after saving', async function() {
            let realm   = `find_realm_${new Date().toISOString()}`;
            let claim   = await this.repositoryLocator.claimRepository.save(new Claim(realm, 'action', 'resource', 'x = y'));
            let all     = await this.repositoryLocator.claimRepository.findByKeys(realm, claim.uniqueKey());
            assert.equal(1, all.length);
            let loaded = all[0];
            assert.equal('action', loaded.action);
            assert.equal('resource', loaded.resource);
            assert.equal('x = y', loaded.condition);
        });
    });


    describe('#saveAndFindByRealm', function() {
        it('should be able to get claim by id after saving', async function() {
            let realm   = `findall_realm_${new Date().toISOString()}`;
            let claim   = await this.repositoryLocator.claimRepository.save(new Claim(realm, 'action', 'resource', 'x = y'));
            let all     = await this.repositoryLocator.claimRepository.findByRealm(claim.realm);
            assert.equal(1, all.length);
            let loaded = all[0];
            assert.equal('action', loaded.action);
            assert.equal('resource', loaded.resource);
            assert.equal('x = y', loaded.condition);
        });
    });


    describe('#saveAndRemove', function() {
        it('should be able to save and remove claim by id', async function() {
            let realm   = `remove_realm_${new Date().toISOString()}`;
            let claim1   = await this.repositoryLocator.claimRepository.save(new Claim(realm, 'read', 'resource', 'x = y'));
            let claim2   = await this.repositoryLocator.claimRepository.save(new Claim(realm, 'write', 'resource', 'x = y'));
            let removed = await this.repositoryLocator.claimRepository.remove(claim1);
            assert.equal(true, removed);
            let all     = await this.repositoryLocator.claimRepository.findByRealm(realm);
            assert.equal(1, all.length);
        });
    });


});
