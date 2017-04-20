var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);

import type {IRealm}                from '../../src/domain/interface';
import {RealmRepositorySqlite}      from '../../src/repository/sqlite/realm_repository';
import {DBHelper}                   from '../../src/repository/sqlite/db_helper';
import {QueryOptions}               from '../../src/repository/interface';
import {Realm}                      from '../../src/domain/realm';
import {PersistenceError}           from '../../src/repository/persistence_error';
import {DefaultSecurityCache}       from '../../src/cache/security_cache';

describe('RealmRepository', function() {
    let dbHelper:         DBHelper;
    let realmRepository:  RealmRepositorySqlite;

    before(function(done) {
      this.dbHelper = new DBHelper(':memory:');
      //this.dbHelper = new DBHelper('/tmp/test.db');
      this.dbHelper.db.on('trace', function(trace){
          //console.log(`trace ${trace}`);
      })
      //
      this.realmRepository = new RealmRepositorySqlite(this.dbHelper, new DefaultSecurityCache());
      this.dbHelper.createTables(() => {
        done();
      });
    });

    after(function(done) {
      this.dbHelper.close();
      done();
    });

    beforeEach(function() {
      this.realmRepository.cache.clear();
    });

    describe('#saveGetById', function() {
      it('should not be able to get realm by id without saving', async function() {
          try {
              let realm = await this.realmRepository.findById(1000);
              assert(false, 'should not return realm');
          } catch(err) {
          }
      });
    });

    describe('#save', function() {
      it('should not be able to save same realm', async function() {
          try {
              let realm  = await this.realmRepository.save(new Realm('same_domain'));
              await this.realmRepository.save(new Realm('same_domain'));
              assert(false, 'should not save realm');
          } catch(err) {
          }
      });
    });

    describe('#saveGetById', function() {
      it('should be able to get realm by id after saving', async function() {
          let realm  = await this.realmRepository.save(new Realm(`random-domain_${Math.random()}`));
          let loaded = await this.realmRepository.findById(realm.id);
          assert.equal(realm.realmName, loaded.realmName);
      });
    });

    describe('#findByName', function() {
      it('should be able to find realm by name after saving', async function() {
          let realm  = await this.realmRepository.save(new Realm(`random-domain_${Math.random()}`));
          let loaded = await this.realmRepository.findByName(realm.realmName);
          assert.equal(realm.realmName, loaded.realmName);
      });
    });

    describe('#findByName', function() {
      it('should not be able to find realm by unknown name', async function() {
          try {
              let realm = await this.realmRepository.findByName('unknown-domain');
              await realm;
              assert(false, 'should not return realm');
          } catch(err) {
          }
      });
    });


    describe('#search', function() {
      it('should be able to search domain by name', async function() {
          let realm  = await this.realmRepository.save(new Realm(`random-domain_${Math.random()}`));

          let criteria    = new Map();
          criteria.set('realm_name', realm.realmName);
          let results = await this.realmRepository.search(criteria);
          assert.equal(1, results.length);
          assert.equal(realm.realmName, results[0].realmName);
      });
    });

    describe('#removeById', function() {
      it('should fail', async function() {
          try {
              let removed = await this.realmRepository.removeById(1);
              assert(false, 'should fail');
          } catch(err) {
          }
      });
    });
});
