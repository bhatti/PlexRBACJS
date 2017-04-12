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
        console.log(`trace ${trace}`);
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
    it('should not be able to get claim by id without saving', function(done) {
        this.claimRepository.findById(1000).
            then(claim => {
            done(new Error('should fail'));
        }).catch(err => {
            done();
        });
    });
  });

  describe('#saveGetById', function() {
    it('should be able to get claim by id after saving', function(done) {
        this.realmRepository.save(new RealmImpl(null, 'test-domain')).
        then(realm => {
            return this.claimRepository.save(new ClaimImpl(null, realm, 'action', 'resource', 'x = y'));
        }).then(saved => {
            return this.claimRepository.findById(saved.id);
        }).then(claim => {
            assert.equal('action', claim.action);
            assert.equal('resource', claim.resource);
            assert.equal('x = y', claim.condition);
            done();
        }).catch(err => {
            done(err);
        });
    });
  });


  describe('#saveAndRemoveGetById', function() {
    it('should be able to save and remove claim by id', function(done) {
        this.realmRepository.save(new RealmImpl(null, 'fake-domain')).
        then(realm => {
            return this.claimRepository.save(new ClaimImpl(null, realm, 'action', 'resource', 'x = y'));
        }).then(saved => {
            return this.claimRepository.removeById(saved.id);
        }).then(result => {
            assert.equal(true, result);
            done();
        }).catch(err => {
            done(err);
        });
    });
  });

  describe('#addClaimToPrincipal', function() {
    it('should be able to add claims to principal', function(done) {
        this.realmRepository.save(new RealmImpl(null, 'domain-x')).
            then(realm => {
            return this.principalRepository.save(new PrincipalImpl(null, realm, 'xuser'));
        }).then(principal => {
            let claims = [
                new ClaimImpl(null, principal.realm, 'action1', 'resource1', 'condition1'),
                new ClaimImpl(null, principal.realm, 'action2', 'resource2', 'condition2'),
                new ClaimImpl(null, principal.realm, 'action3', 'resource3', 'condition3'),
            ]
            return this.claimRepository.addClaimsToPrincipal(principal, claims);
        }).then(principal => {
            let claims = [
                new ClaimImpl(null, principal.realm, 'action4', 'resource4', 'condition4')
            ]
            this.claimRepository.addClaimsToPrincipal(principal, claims).
            then(result => {
                return this.principalRepository.findByName(principal.realm.realmName, principal.principalName);
            }).then(loaded => {
                //assert.equal(4, loaded.claims.size);
                done();
            }).catch(err => {
                done(err);
            });
        }).catch(err => {
            done(err);
        });
    });
  });

  describe('#search', function() {
    it('should be able to search domain by name', function(done) {
        let criteria    = new Map();
        criteria.set('condition', 'x = y');
        this.claimRepository.search(criteria).
            then(results => {
            assert.equal(1, results.length);
            assert.equal('action', results[0].action);
            assert.equal('resource', results[0].resource);
            assert.equal('x = y', results[0].condition);
            done();
        });
    });
  });

  describe('#removeById', function() {
    it('should fail because of unknown id', function(done) {
        this.claimRepository.removeById(1000).
        then(result => {
            assert(false, result);
        }).catch(err => {
            done();
        });
    });
  });
});
