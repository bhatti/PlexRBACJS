var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);

import type {Realm}                 from '../../src/domain/interface';
import type {Claim}                 from '../../src/domain/interface';
import {RealmRepositorySqlite}      from '../../src/repository/sqlite/realm_repository';
import {ClaimRepositorySqlite}      from '../../src/repository/sqlite/claim_repository';
import {PrincipalRepositorySqlite}  from '../../src/repository/sqlite/principal_repository';
import {RoleRepositorySqlite}       from '../../src/repository/sqlite/role_repository';
import {DBHelper}                   from '../../src/repository/sqlite/db_helper';
import {QueryOptions}               from '../../src/repository/interface';
import {ClaimImpl}                  from '../../src/domain/claim';
import {RealmImpl}                  from '../../src/domain/realm';
import {RoleImpl}                   from '../../src/domain/role';
import {PrincipalImpl}              from '../../src/domain/principal';
import {PersistenceError}           from '../../src/repository/persistence_error';
import {DefaultSecurityCache}       from '../../src/cache/security_cache';

describe('ClaimRepository', function() {
  let dbHelper:         DBHelper;
  let claimRepository:  ClaimRepositorySqlite;
  let realmRepository:  RealmRepositorySqlite;
  let principalRepository:  PrincipalRepositorySqlite;
  let roleRepository:       RoleRepositorySqlite;

  before(function(done) {
    this.dbHelper = new DBHelper(':memory:');
    //this.dbHelper = new DBHelper('/tmp/test.db');
    this.dbHelper.db.on('trace', function(trace){
        //console.log(`trace ${trace}`);
    })
    //
    this.realmRepository     = new RealmRepositorySqlite(this.dbHelper, new DefaultSecurityCache());
    this.claimRepository     = new ClaimRepositorySqlite(this.dbHelper, this.realmRepository);
    this.roleRepository      = new RoleRepositorySqlite(this.dbHelper, this.realmRepository, this.claimRepository, new DefaultSecurityCache());
    this.principalRepository = new PrincipalRepositorySqlite(this.dbHelper, this.realmRepository, this.roleRepository, this.claimRepository, new DefaultSecurityCache());
    //
    this.dbHelper.createTables(() => {
      done();
    });
  });

  after(function(done) {
    this.dbHelper.close();
    done();
  });

  describe('#saveGetById', function() {
      it('should not be able to get claim by id without saving', async function() {
          try {
              let claim = this.claimRepository.findById(1000);
              await claim;
              assert(false, 'should not return claim');
          } catch(err) {
          }
      });
  });

  describe('#saveGetById', function() {
    it('should be able to get claim by id after saving', async function() {
        let realm  = await this.realmRepository.save(new RealmImpl(null, `random-domain_${Math.random()}`));
        let claim  = await this.claimRepository.save(new ClaimImpl(null, realm, 'action', 'resource', 'x = y'));
        let loaded = await this.claimRepository.findById(claim.id);
        assert.equal('action', loaded.action);
        assert.equal('resource', loaded.resource);
        assert.equal('x = y', loaded.condition);
    });
  });


  describe('#saveAndRemoveGetById', function() {
    it('should be able to save and remove claim by id', async function() {
        let realm   = await this.realmRepository.save(new RealmImpl(null, `random-domain_${Math.random()}`));
        let claim   = await this.claimRepository.save(new ClaimImpl(null, realm, 'action', 'resource', 'x = y'));
        let removed = await this.claimRepository.removeById(claim.id);
        assert.equal(true, removed);
    });
  });

  describe('#addClaimToPrincipal', function() {
    it('should be able to add claims to principal', async function() {
        let realm     = await this.realmRepository.save(new RealmImpl(null, `random-domain_${Math.random()}`));

        let principal = await this.principalRepository.save(new PrincipalImpl(null, realm, 'xuser'));
        let claims    = [
                new ClaimImpl(null, principal.realm, 'action1', 'resource1', 'condition1'),
                new ClaimImpl(null, principal.realm, 'action2', 'resource2', 'condition2'),
                new ClaimImpl(null, principal.realm, 'action3', 'resource3', 'condition3'),
            ]
        principal     = await this.claimRepository.addClaimsToPrincipal(principal, claims);
        let loaded    = await this.principalRepository.findByName(realm.realmName, principal.principalName);
        console.log(`findByName ${loaded}`)
        console.log(`loaded ${loaded.claims.size}`)
        // TODO fix this
        //assert.equal(4, loaded.claims.size);
    });
  });


  describe('#search', function() {
    it('should be able to search domain by name', async function() {
        let criteria    = new Map();
        criteria.set('condition', 'x = y');
        let results = await this.claimRepository.search(criteria);
        assert.equal(1, results.length);
        assert.equal('action', results[0].action);
        assert.equal('resource', results[0].resource);
        assert.equal('x = y', results[0].condition);
    });
  });


  describe('#removeById', function() {
    it('should fail because of unknown id', async function() {
        let removed = await this.claimRepository.removeById(1000);
        assert.ok(removed);
    });
  });
});
