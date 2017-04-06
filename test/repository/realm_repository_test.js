var assert = require('chai').assert;

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
                console.log(`got ${String(realm)} calling done`);
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
                console.log(`got ${String(realm)} calling done`);
            }).catch(err => {
                done(err);
            });
        });
    });
  });

/*
          repository.search(new Map()).
              then(result => {
              console.log(`all ---- ${result.length}`);
              //let realm = repository.findById(saved.id);
              //console.log(`got ${realm}`)
              //assert.equal('mydomain', realm.realmName);
              done();
          });
  */
});
