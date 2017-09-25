var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);

import type {IRealm}                from '../../src/domain/interface';
import type {ILimit}                from '../../src/domain/interface';
import type {IPrincipal}            from '../../src/domain/interface';
import {RealmRepositorySqlite}      from '../../src/repository/sqlite/realm_repository';
import {LimitRepositorySqlite} from '../../src/repository/sqlite/limit_repository';
import {PrincipalRepositorySqlite}  from '../../src/repository/sqlite/principal_repository';
import {RoleRepositorySqlite}       from '../../src/repository/sqlite/role_repository';
import {DBFactory}                  from '../../src/repository/sqlite/db_factory';
import {RepositoryLocator}          from '../../src/repository/repository_locator';
import {QueryOptions}               from '../../src/repository/interface';
import {Limit}                      from '../../src/domain/limit';
import {Realm}                      from '../../src/domain/realm';
import {Role}                       from '../../src/domain/role';
import {Principal}                  from '../../src/domain/principal';
import {PersistenceError}           from '../../src/repository/persistence_error';
import {DefaultSecurityCache}       from '../../src/cache/security_cache';

describe('LimitRepository', function() {
    let repositoryLocator: RepositoryLocator;

    before(async function() {
        this.repositoryLocator = new RepositoryLocator('sqlite', ':memory:', async () => {
        });
    });

    after(function(done) {
        this.repositoryLocator.dbFactory.close();
        done();
    });

    describe('#saveGetById', function() {
        it('should not be able to get Limit by id without saving', async function() {
            try {
                let Limit = this.repositoryLocator.limitRepository.findById(1000);
                await Limit;
                assert(false, 'should not return Limit');
            } catch(err) {
            }
        });
    });

    describe('#saveGetById', function() {
        it('should be able to get Limit by id after saving', async function() {
            let realm = await this.repositoryLocator.realmRepository.save(new Realm(`random-domain_${Math.random()}`));
            let principal  = await this.repositoryLocator.principalRepository.save(new Principal(realm, 'superuser', {'user': 'barry', 'age':31}));

            let limit = new Limit('type', 'resource', 10, 1, null);
            limit.principal = principal;
            limit  = await this.repositoryLocator.limitRepository.save(limit);
            let loaded = await this.repositoryLocator.limitRepository.findById(limit.id);
            assert(loaded != null);
            assert.equal('type', loaded.type);
            assert.equal('resource', loaded.resource);
            assert.equal(10, loaded.maxAllowed);
            assert.equal(1, loaded.value);
            assert(loaded.expirationDate != null);
            assert.equal('undefined', loaded.principal.principalName);
            assert.equal(0, principal.limits.length);
            await this.repositoryLocator.limitRepository.__loadPrincipalLimits(principal);
            assert.equal(1, principal.limits.length);
            assert.equal('superuser', principal.principalName);
        });
    });


    describe('#saveAndRemoveGetById', function() {
        it('should be able to save and remove Limit by id', async function() {
            let realm = await this.repositoryLocator.realmRepository.save(new Realm(`random-domain_${Math.random()}`));
            let principal  = await this.repositoryLocator.principalRepository.save(new Principal(realm, 'matt', {'user': 'barry', 'age':31}));

            let limit = new Limit('type', 'resource', 10, 1, null);
            limit.principal = principal;
            limit   = await this.repositoryLocator.limitRepository.save(limit);
            let removed = await this.repositoryLocator.limitRepository.removeById(limit.id);
            assert.equal(true, removed);
        });
    });


    describe('#search', function() {
        it('should be able to search domain by name', async function() {
            let realm = await this.repositoryLocator.realmRepository.save(new Realm(`random-domain_${Math.random()}`));
            let principal  = await this.repositoryLocator.principalRepository.save(new Principal(realm, 'ali', {'user': 'john', 'age':31}));

            let resources = ['monitoring', 'submission']
            for (var i=0; i<2; i++) {
                let limit = new Limit('apps', resources[i], 10, 1, null);
                limit.principal = principal;
                limit   = await this.repositoryLocator.limitRepository.save(limit);
            }

            let criteria    = new Map();
            criteria.set('principal_id', principal.id);
            let results = await this.repositoryLocator.limitRepository.search(criteria);
            assert.equal(2, results.length);
            assert.equal('apps', results[0].type);
            assert.equal('monitoring', results[0].resource);
            assert.equal('submission', results[1].resource);
            assert.equal(10, results[0].maxAllowed);
            assert.equal(1, results[0].value);
            assert(results[0].expirationDate != null);
        });
    });


    describe('#removeById', function() {
        it('should fail because of unknown id', async function() {
            let removed = await this.repositoryLocator.limitRepository.removeById(1000);
            assert.ok(removed);
        });
    });

    describe('#increment', function() {
        it('should be able to increment resource', async function() {
            let exp = new Date(2014, 1, 1);
            let realm = await this.repositoryLocator.realmRepository.save(new Realm(`random-domain_${Math.random()}`));
            let principal  = await this.repositoryLocator.principalRepository.save(new Principal(realm, 'matt', {'user': 'barry', 'age':31}));

            let limit = new Limit('intel', 'monitor-app', 20, 1, exp);
            limit.principal = principal;
            //
            limit  = await this.repositoryLocator.limitRepository.save(limit);
            //
            let loaded = await this.repositoryLocator.limitRepository.findById(limit.id);
            assert(loaded != null);
            assert.equal('intel', loaded.type);
            assert.equal('monitor-app', loaded.resource);
            assert.equal(20, loaded.maxAllowed);
            assert.equal(1, loaded.value);
            assert.equal('2014-02-02T23:59:59', loaded.expirationISODate());
            assert(loaded.expirationDate != null);

            for (let i=0; i<10; i++) {
              let updated = await this.repositoryLocator.limitRepository.increment(loaded.id);
              assert.equal(20, updated.maxAllowed);
              assert.equal(i+2, updated.value);
              // 2014 should be old
              assert.isNotOk(updated.valid(), `expiration too old: value ${updated.value} <= ${updated.maxAllowed} - ${updated.expirationISODate()} >= ${new Date().toISOString()}`);
            }

            let updated = await this.repositoryLocator.limitRepository.findById(loaded.id);
            assert.equal(20, updated.maxAllowed);
            assert.equal(11, updated.value);
            // 2014 should be old
            assert.isNotOk(updated.valid(), `expiration is still old: value ${updated.value} <= ${updated.maxAllowed} - ${updated.expirationISODate()} >= ${new Date().toISOString()}`);
            updated.expirationDate   = new Date(new Date().setFullYear(new Date().getFullYear() + 50));

            await this.repositoryLocator.limitRepository.save(updated);
            assert.isOk(updated.valid(), `should be valid value ${updated.value} <= ${updated.maxAllowed} - ${updated.expirationISODate()} >= ${new Date().toISOString()}`);
            for (let i=0; i<8; i++) {
              let updated = await this.repositoryLocator.limitRepository.increment(loaded.id);
              assert.equal(20, updated.maxAllowed);
              assert.equal(i+12, updated.value);
              assert.isOk(updated.valid(), `unexpected failed: value ${updated.value} <= ${updated.maxAllowed} - ${updated.expirationISODate()} >= ${new Date().toISOString()}`);
            }
            updated = await this.repositoryLocator.limitRepository.increment(updated.id);
            assert.isOk(updated.valid(), ` should not be valid value ${updated.value} <= ${updated.maxAllowed} - ${updated.expirationISODate()} >= ${new Date().toISOString()}`);
            try {
                await this.repositoryLocator.limitRepository.increment(updated.id);
                assert.isOk(false, 'should failed');
            } catch (e) {
            }
        });
    });

});
