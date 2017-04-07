var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);

import type {Realm}                 from '../../src/domain/interface';
import type {Role}                  from '../../src/domain/interface';
import {RealmRepositorySqlite}      from '../../src/repository/sqlite/realm_repository';
import {RoleRepositorySqlite}       from '../../src/repository/sqlite/role_repository';
import {ClaimRepositorySqlite}      from '../../src/repository/sqlite/claim_repository';
import {DBHelper}                   from '../../src/repository/sqlite/db_helper';
import {QueryOptions}               from '../../src/repository/interface';
import {RoleImpl}                   from '../../src/domain/role';
import {RealmImpl}                  from '../../src/domain/realm';
import {PersistenceError}           from '../../src/repository/persistence_error';

describe('RoleRepository', function() {
  let dbHelper:         DBHelper;
  let roleRepository:   RoleRepositorySqlite;
  let realmRepository:  RealmRepositorySqlite;
  let claimRepository:  ClaimRepositorySqlite;
 
  before(function(done) {
    this.dbHelper = new DBHelper(':memory:');
    //this.dbHelper = new DBHelper('/tmp/test.db');
    this.dbHelper.db.on('trace', function(trace){
        console.log(`trace ${trace}`);
    })
    this.realmRepository     = new RealmRepositorySqlite(this.dbHelper);
    this.claimRepository     = new ClaimRepositorySqlite(this.dbHelper, this.realmRepository);
    this.roleRepository      = new RoleRepositorySqlite(this.dbHelper, this.realmRepository, this.claimRepository);
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
    it('should not be able to get role by id without saving', function(done) {
        this.roleRepository.findById(1000).
            then(role => {
            done(new Error('should fail'));
        }).catch(err => {
            done();
        });
    });
  });

  describe('#saveGetById', function() {
    it('should be able to get role by id after saving', function(done) {
        this.realmRepository.save(new RealmImpl(null, 'test-domain')).
        then(realm => {
            return this.roleRepository.save(new RoleImpl(null, realm, 'admin-role'));
        }).then(saved => {
            return this.roleRepository.findById(saved.id);
        }).then(role => {
            assert.equal('admin-role', role.roleName);
            assert.equal('test-domain', role.realm.realmName);
            done();
        }).catch(err => {
            done(err);
        });
    });
  });


  describe('#saveAndRemoveGetById', function() {
    it('should be able to save and remove role by id', function(done) {
        this.realmRepository.save(new RealmImpl(null, 'fake-domain')).
        then(realm => {
            return this.roleRepository.save(new RoleImpl(null, realm, 'teller-role'));
        }).then(saved => {
            return this.roleRepository.removeById(saved.id);
        }).then(result => {
            assert.equal(true, result);
            done();
        }).catch(err => {
            done(err);
        });
    });
  });


  describe('#saveGetByName', function() {
    it('should be able to get role by name after saving', function(done) {
        this.realmRepository.save(new RealmImpl(null, 'another-domain')).
        then(realm => {
            return this.roleRepository.save(new RoleImpl(null, realm, 'manager-role'));
        }).then(saved => {
            return this.roleRepository.findByName(saved.roleName);
        }).then(role => {
            assert.equal('manager-role', role.roleName);
            assert.equal('another-domain', role.realm.realmName);
            done();
        }).catch(err => {
            done(err);
        });
    });
  });

  describe('#saveGetByName', function() {
    it('should not be able to get role by unknown name', function(done) {
        this.roleRepository.findByName('unknown-role').
            then(role => {
            done(new Error('should fail'));
        }).catch(err => {
            done();
        });
    });
  });

  describe('#search', function() {
    it('should be able to search domain by name', function(done) {
        let criteria    = new Map();
        criteria.set('role_name', 'admin-role');
        this.roleRepository.search(criteria).
            then(results => {
            assert.equal(1, results.length);
            assert.equal('admin-role', results[0].roleName);
            done();
        });
    });
  }); 

  describe('#removeById', function() {
    it('should fail because of unknown id', function(done) {
        this.roleRepository.removeById(1000).
        then(result => {
            assert(false, result);
        }).catch(err => {
            done();
        });
    });
  });
});
