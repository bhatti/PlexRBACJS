var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);

import type {IRealm}                from '../../src/domain/interface';
import {RealmRepositorySqlite}      from '../../src/repository/sqlite/realm_repository';
import {DBFactory}                  from '../../src/repository/sqlite/db_factory';
import {RepositoryLocator}          from '../../src/repository/repository_locator';
import {QueryOptions}               from '../../src/repository/interface';
import {Realm}                      from '../../src/domain/realm';
import {PersistenceError}           from '../../src/repository/persistence_error';
import {DefaultSecurityCache}       from '../../src/cache/security_cache';

describe('RealmRepository', function() {
    let repositoryLocator: RepositoryLocator;

    before(function(done) {
        this.repositoryLocator = new RepositoryLocator('sqlite', ':memory:', done);
    });

    after(function(done) {
        this.repositoryLocator.dbFactory.close();
        done();
    });

    beforeEach(function() {
        this.repositoryLocator.realmRepository.cache.clear();
    });

    describe('#saveGetById', function() {
        it('should not be able to get realm by id without saving', async function() {
            try {
                let realm = await this.repositoryLocator.realmRepository.findById(1000);
                assert(false, 'should not return realm');
            } catch(err) {
            }
        });
    });

    describe('#save', function() {
        it('should not be able to save same realm', async function() {
            try {
                let realm  = await this.repositoryLocator.realmRepository.save(new Realm('same_domain'));
                await this.repositoryLocator.realmRepository.save(new Realm('same_domain'));
                assert(false, 'should not save realm');
            } catch(err) {
            }
        });
    });

    describe('#saveGetById', function() {
        it('should be able to get realm by id after saving', async function() {
            let realm  = await this.repositoryLocator.realmRepository.save(new Realm(`random-domain_${Math.random()}`));
            let loaded = await this.repositoryLocator.realmRepository.findById(realm.id);
            assert.equal(realm.realmName, loaded.realmName);
        });
    });

    describe('#findByName', function() {
        it('should be able to find realm by name after saving', async function() {
            let realm  = await this.repositoryLocator.realmRepository.save(new Realm(`random-domain_${Math.random()}`));
            let loaded = await this.repositoryLocator.realmRepository.findByName(realm.realmName);
            assert.equal(realm.realmName, loaded.realmName);
        });
    });

    describe('#findByName', function() {
        it('should not be able to find realm by unknown name', async function() {
            try {
                let realm = await this.repositoryLocator.realmRepository.findByName('unknown-domain');
                await realm;
                assert(false, 'should not return realm');
            } catch(err) {
            }
        });
    });


    describe('#search', function() {
        it('should be able to search domain by name', async function() {
            let realm  = await this.repositoryLocator.realmRepository.save(new Realm(`random-domain_${Math.random()}`));

            let criteria    = new Map();
            criteria.set('realm_name', realm.realmName);
            let results = await this.repositoryLocator.realmRepository.search(criteria);
            assert.equal(1, results.length);
            assert.equal(realm.realmName, results[0].realmName);
        });
    });

    describe('#removeById', function() {
        it('should fail', async function() {
            try {
                let removed = await this.repositoryLocator.realmRepository.removeById(1);
                assert(false, 'should fail');
            } catch(err) {
            }
        });
    });
});
