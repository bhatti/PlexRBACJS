var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);

import type {IRealm}                from '../../src/domain/interface';
import type {IClaim}                from '../../src/domain/interface';
import type {IRole}                 from '../../src/domain/interface';
import {RealmRepositorySqlite}      from '../../src/repository/sqlite/realm_repository';
import {ClaimRepositorySqlite}      from '../../src/repository/sqlite/claim_repository';
import {RoleRepositorySqlite}       from '../../src/repository/sqlite/role_repository';
import {PrincipalRepositorySqlite}  from '../../src/repository/sqlite/principal_repository';
import {DBFactory}                  from '../../src/repository/sqlite/db_factory';
import {RepositoryLocator}          from '../../src/repository/repository_locator';
import {QueryOptions}               from '../../src/repository/interface';
import {Claim}                      from '../../src/domain/claim';
import {Realm}                      from '../../src/domain/realm';
import {Role}                       from '../../src/domain/role';
import {Principal}                  from '../../src/domain/principal';
import {PersistenceError}           from '../../src/repository/persistence_error';
import {DefaultSecurityCache}       from '../../src/cache/security_cache';


describe('PrincipalRepository', function() {
    let repositoryLocator: RepositoryLocator;

    before(function(done) {
        this.repositoryLocator = new RepositoryLocator('sqlite', ':memory:', done);
    });

    after(function(done) {
        this.repositoryLocator.dbFactory.close();
        done();
    });

    describe('#saveGetById', function() {
        it('should not be able to get principal by id without saving', async function() {
            try {
                let principal = await this.repositoryLocator.principalRepository.findById(1000);
                await principal;
                assert(false, 'should not return principal');
            } catch(err) {
            }
        });
    });

    describe('#saveGetById', function() {
        it('should be able to get principal by id after saving', async function() {
            let realm  = await this.repositoryLocator.realmRepository.save(new Realm(`random-domain_${Math.random()}`));
            let saved  = await this.repositoryLocator.principalRepository.save(new Principal(realm, 'superuser', {'user': 'barry', 'age':31}));
            let loaded = await this.repositoryLocator.principalRepository.findById(saved.id);
            assert.equal('superuser', loaded.principalName);
            assert.equal('barry', loaded.properties.user);
            assert.equal(31, loaded.properties.age);
        });
    });


    describe('#saveAndRemoveGetById', function() {
        it('should be able to save and remove principal by id', async function() {
            let realm   = await this.repositoryLocator.realmRepository.save(new Realm(`random-domain_${Math.random()}`));
            let saved   = await this.repositoryLocator.principalRepository.save(new Principal(realm, 'username'));
            let removed = await this.repositoryLocator.principalRepository.removeById(saved.id);

            assert.equal(true, removed);

            try {
                let principal = await this.repositoryLocator.principalRepository.findById(saved.id);
                await principal;
                assert(false, 'should not return principal');
            } catch(err) {
            }
        });
    });


    describe('#saveGetByName', function() {
        it('should be able to get principal by name after saving', async function() {
            let realm     = await this.repositoryLocator.realmRepository.save(new Realm(`random-domain_${Math.random()}`));
            let saved     = await this.repositoryLocator.principalRepository.save(new Principal(realm, 'xuser'));
            let loaded    = await this.repositoryLocator.principalRepository.findByName(realm.realmName, saved.principalName);
            assert.equal('xuser', loaded.principalName);
        });
    });


    describe('#saveGetByName', function() {
        it('should not be able to get principal by unknown name', async function() {
            try {
                let principal = await this.repositoryLocator.principalRepository.findByName('rand-realm', 1000);
                await principal;
                assert(false, 'should not return principal');
            } catch(err) {
            }
        });
    });


    describe('#search', function() {
        it('should be able to search principal by name', async function() {
            let realm       = await this.repositoryLocator.realmRepository.save(new Realm(`random-domain_${Math.random()}`));
            let saved       = await this.repositoryLocator.principalRepository.save(new Principal(realm, 'searchuser'));
            let criteria    = new Map();
            criteria.set('principal_name', 'searchuser');
            let results = await this.repositoryLocator.principalRepository.search(criteria);
            assert.equal(1, results.length);
            assert.equal('searchuser', results[0].principalName);
        });
    });

    describe('#removeById', function() {
        it('should fail because of unknown id', async function() {
            let removed = await this.repositoryLocator.principalRepository.removeById(1000);
            assert.ok(removed);
        });
    });
});
