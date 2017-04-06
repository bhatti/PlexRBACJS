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
  let dbHelper: DBHelper;

  before(function(done) {
    this.dbHelper = new DBHelper(':memory:');
    //this.dbHelper = new DBHelper('/tmp/test.db');
    this.dbHelper.db.on('trace', function(trace){
        console.log(`trace ${trace}`);
    })
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
    it('should not be able to get realm by id without saving', function(done) {
        let repository = new RealmRepositorySqlite(this.dbHelper);
        repository.findById(1000).
            then(realm => {
            done(new Error('should fail'));
        }).catch(err => {
            done();
        });
    });
  });

  describe('#saveGetById', function() {
    it('should be able to get realm by id after saving', function(done) {
        let repository = new RealmRepositorySqlite(this.dbHelper);
        repository.save(new RealmImpl(null, 'mydomain')).
            then(saved => {
            repository.findById(saved.id).
                then(realm => {
                assert.equal('mydomain', realm.realmName);
                done();
            }).catch(err => {
                done(err);
            });
        });
    });
  });

  describe('#saveGetByName', function() {
    it('should be able to get realm by name after saving', function(done) {
        let repository = new RealmRepositorySqlite(this.dbHelper);
        repository.save(new RealmImpl(null, 'anotherdomain')).
            then(saved => {
            repository.findByName('anotherdomain').
                then(realm => {
                assert.equal('anotherdomain', realm.realmName);
                done();
            }).catch(err => {
                done(err);
            });
        });
    });
  });

  describe('#saveGetByName', function() {
    it('should not be able to get realm by unknown name', function(done) {
        let repository = new RealmRepositorySqlite(this.dbHelper);
        repository.findByName('unknown-domain').
            then(realm => {
            done(new Error('should fail'));
        }).catch(err => {
            done();
        });
    });
  });

  describe('#search', function() {
    it('should be able to search domain by name', function(done) {
        let repository  = new RealmRepositorySqlite(this.dbHelper);
        let criteria    = new Map();
        criteria.set('realm_name', 'mydomain');
        repository.search(criteria).
            then(results => {
            assert.equal(1, results.length);
            assert.equal('mydomain', results[0].realmName);
            done();
        });
    });
  });
});
