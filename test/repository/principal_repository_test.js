var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);

import type {Realm}                 from '../../src/domain/interface';
import type {Claim}                 from '../../src/domain/interface';
import type {Role}                  from '../../src/domain/interface';
import {RealmRepositorySqlite}      from '../../src/repository/sqlite/realm_repository';
import {ClaimRepositorySqlite}      from '../../src/repository/sqlite/claim_repository';
import {RoleRepositorySqlite}       from '../../src/repository/sqlite/role_repository';
import {PrincipalRepositorySqlite}  from '../../src/repository/sqlite/principal_repository';
import {DBHelper}                   from '../../src/repository/sqlite/db_helper';
import {QueryOptions}               from '../../src/repository/interface';
import {ClaimImpl}                  from '../../src/domain/claim';
import {RealmImpl}                  from '../../src/domain/realm';
import {RoleImpl}                   from '../../src/domain/role';
import {PrincipalImpl}              from '../../src/domain/principal';
import {PersistenceError}           from '../../src/repository/persistence_error';
import {DefaultSecurityCache}       from '../../src/cache/security_cache';


describe('PrincipalRepository', function() {
  let dbHelper:             DBHelper;
  let claimRepository:      ClaimRepositorySqlite;
  let realmRepository:      RealmRepositorySqlite;
  let roleRepository:       RoleRepositorySqlite;
  let principalRepository:  PrincipalRepositorySqlite;

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
    it('should not be able to get principal by id without saving', function(done) {
        this.principalRepository.findById(1000).
            then(result => {
            done(new Error('should fail'));
        }).catch(err => {
            done();
        });
    });
  });

  describe('#saveGetById', function() {
    it('should be able to get principal by id after saving', function(done) {
        this.realmRepository.save(new RealmImpl(null, 'test-domain')).
        then(realm => {
            return this.principalRepository.save(new PrincipalImpl(null, realm, 'superuser'));
        }).then(saved => {
            return this.principalRepository.findById(saved.id);
        }).then(principal => {
            assert.equal('superuser', principal.principalName);
            done();
        }).catch(err => {
            done(err);
        });
    });
  });


  describe('#saveAndRemoveGetById', function() {
    it('should be able to save and remove principal by id', function(done) {
        this.realmRepository.save(new RealmImpl(null, 'fake-domain')).
        then(realm => {
            return this.principalRepository.save(new PrincipalImpl(null, realm, 'username'));
        }).then(saved => {
            return this.principalRepository.removeById(saved.id);
        }).then(result => {
            assert.equal(true, result);
            done();
        }).catch(err => {
            done(err);
        });
    });
  });


  describe('#saveGetByName', function() {
    it('should be able to get principal by name after saving', function(done) {
        this.realmRepository.save(new RealmImpl(null, 'domain-x')).
            then(realm => {
            return this.principalRepository.save(new PrincipalImpl(null, realm, 'xuser'));
        }).then(principal => {
            this.principalRepository.findByName(principal.realm.realmName, principal.principalName).
            then(loaded => {
                assert.equal('xuser', loaded.principalName);
                done();
            }).catch(err => {
                done(err);
            });
        }).catch(err => {
            done(err);
        });
    });
  });

  describe('#saveGetByName', function() {
    it('should not be able to get principal by unknown name', function(done) {
        this.principalRepository.findByName('unknown-principal').
            then(realm => {
            done(new Error('should fail'));
        }).catch(err => {
            done();
        });
    });
  });

  describe('#search', function() {
    it('should be able to search principal by name', function(done) {
        let criteria    = new Map();
        criteria.set('principal_name', 'superuser');
        this.principalRepository.search(criteria).
            then(results => {
            assert.equal(1, results.length);
            assert.equal('superuser', results[0].principalName);
            done();
        });
    });
  });

  describe('#removeById', function() {
    it('should fail because of unknown id', function(done) {
        this.principalRepository.removeById(1000).
        then(result => {
            assert(false, result);
        }).catch(err => {
            done();
        });
    });
  });
});
