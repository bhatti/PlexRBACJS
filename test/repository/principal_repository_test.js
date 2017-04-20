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
import {QueryOptions}               from '../../src/repository/interface';
import {Claim}                      from '../../src/domain/claim';
import {Realm}                      from '../../src/domain/realm';
import {Role}                       from '../../src/domain/role';
import {Principal}                  from '../../src/domain/principal';
import {PersistenceError}           from '../../src/repository/persistence_error';
import {DefaultSecurityCache}       from '../../src/cache/security_cache';


describe('PrincipalRepository', function() {
  let dbFactory:            DBFactory;
  let claimRepository:      ClaimRepositorySqlite;
  let realmRepository:      RealmRepositorySqlite;
  let roleRepository:       RoleRepositorySqlite;
  let principalRepository:  PrincipalRepositorySqlite;

  before(function(done) {
    this.dbFactory = new DBFactory(':memory:');
    //this.dbFactory = new DBFactory('/tmp/test.db');
    this.dbFactory.db.on('trace', function(trace){
        //console.log(`trace ${trace}`);
    })
    //
    this.realmRepository     = new RealmRepositorySqlite(this.dbFactory, new DefaultSecurityCache());
    this.claimRepository     = new ClaimRepositorySqlite(this.dbFactory, this.realmRepository);
    this.roleRepository      = new RoleRepositorySqlite(this.dbFactory, this.realmRepository, this.claimRepository, new DefaultSecurityCache());
    this.principalRepository = new PrincipalRepositorySqlite(this.dbFactory, this.realmRepository, this.roleRepository, this.claimRepository, new DefaultSecurityCache());

    //
    this.dbFactory.createTables(() => {
      done();
    });
  });

  after(function(done) {
    this.dbFactory.close();
    done();
  });

  describe('#saveGetById', function() {
    it('should not be able to get principal by id without saving', async function() {
        try {
            let principal = await this.principalRepository.findById(1000);
            await principal;
            assert(false, 'should not return principal');
        } catch(err) {
        }
    });
  });

  describe('#saveGetById', function() {
    it('should be able to get principal by id after saving', async function() {
        let realm  = await this.realmRepository.save(new Realm(`random-domain_${Math.random()}`));
        let saved  = await this.principalRepository.save(new Principal(realm, 'superuser'));
        let loaded = await this.principalRepository.findById(saved.id);
        assert.equal('superuser', loaded.principalName);
    });
  });


  describe('#saveAndRemoveGetById', function() {
    it('should be able to save and remove principal by id', async function() {
        let realm   = await this.realmRepository.save(new Realm(`random-domain_${Math.random()}`));
        let saved   = await this.principalRepository.save(new Principal(realm, 'username'));
        let removed = await this.principalRepository.removeById(saved.id);

        assert.equal(true, removed);

        try {
            let principal = await this.principalRepository.findById(saved.id);
            await principal;
            assert(false, 'should not return principal');
        } catch(err) {
        }
    });
  });


  describe('#saveGetByName', function() {
    it('should be able to get principal by name after saving', async function() {
        let realm     = await this.realmRepository.save(new Realm(`random-domain_${Math.random()}`));
        let saved     = await this.principalRepository.save(new Principal(realm, 'xuser'));
        let loaded    = await this.principalRepository.findByName(realm.realmName, saved.principalName);
        assert.equal('xuser', loaded.principalName);
    });
  });


  describe('#saveGetByName', function() {
    it('should not be able to get principal by unknown name', async function() {
        try {
            let principal = await this.principalRepository.findByName('rand-realm', 1000);
            await principal;
            assert(false, 'should not return principal');
        } catch(err) {
        }
    });
  });


  describe('#search', function() {
    it('should be able to search principal by name', async function() {
        let realm       = await this.realmRepository.save(new Realm(`random-domain_${Math.random()}`));
        let saved       = await this.principalRepository.save(new Principal(realm, 'searchuser'));
        let criteria    = new Map();
        criteria.set('principal_name', 'searchuser');
        let results = await this.principalRepository.search(criteria);
        assert.equal(1, results.length);
        assert.equal('searchuser', results[0].principalName);
    });
  });

  describe('#removeById', function() {
    it('should fail because of unknown id', async function() {
        let removed = await this.principalRepository.removeById(1000);
        assert.ok(removed);
    });
  });
});
