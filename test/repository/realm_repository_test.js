var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);

import type {Realm}                 from '../../src/domain/interface';
import {RealmRepositorySqlite}      from '../../src/repository/sqlite/realm_repository';
import {DBHelper}                   from '../../src/repository/sqlite/db_helper';
import {QueryOptions}               from '../../src/repository/interface';
import {RealmImpl}                  from '../../src/domain/realm';
import {PersistenceError}           from '../../src/repository/persistence_error';

describe('RealmRepository', function() {
  let dbHelper:         DBHelper;
  let realmRepository:  RealmRepositorySqlite;

  before(function(done) {
    this.dbHelper = new DBHelper(':memory:');
    //this.dbHelper = new DBHelper('/tmp/test.db');
    this.dbHelper.db.on('trace', function(trace){
        console.log(`trace ${trace}`);
    })
    //
    this.realmRepository = new RealmRepositorySqlite(this.dbHelper);
    this.dbHelper.createTables(() => {
      done();
    });
  });

  after(function(done) {
    this.dbHelper.close();
    done();
  });

  describe('#saveGetById', function() {
    it('should not be able to get realm by id without saving', function(done) {
        this.realmRepository.findById(1000).
            then(realm => {
            done(new Error('should fail'));
        }).catch(err => {
            done();
        });
    });
  });

  describe('#saveGetById', function() {
    it('should be able to get realm by id after saving', function(done) {
        this.realmRepository.save(new RealmImpl(null, 'mydomain')).
            then(saved => {
            return this.realmRepository.findById(saved.id);
        }).then(realm => {
            assert.equal('mydomain', realm.realmName);
            done();
        }).catch(err => {
            done(err);
        });
    });
  });

  describe('#saveGetByName', function() {
    it('should be able to get realm by name after saving', function(done) {
        this.realmRepository.save(new RealmImpl(null, 'anotherdomain')).
            then(saved => {
            return this.realmRepository.findByName('anotherdomain');
        }).then(realm => {
            assert.equal('anotherdomain', realm.realmName);
            done();
        }).catch(err => {
            done(err);
        });
    });
  });

  describe('#saveGetByName', function() {
    it('should not be able to get realm by unknown name', function(done) {
        this.realmRepository.findByName('unknown-domain').
            then(realm => {
            done(new Error('should fail'));
        }).catch(err => {
            done();
        });
    });
  });

  describe('#search', function() {
    it('should be able to search domain by name', function(done) {
        let criteria    = new Map();
        criteria.set('realm_name', 'mydomain');
        this.realmRepository.search(criteria).
            then(results => {
            assert.equal(1, results.length);
            assert.equal('mydomain', results[0].realmName);
            done();
        });
    });
  }); 

  describe('#removeById', function() {
    it('should fail', function(done) {
        this.realmRepository.removeById(1).
        then(result => {
            done(new Error(`should fail ${result}`));
        }).catch(err => {
            done();
        });
    });
  });
});
