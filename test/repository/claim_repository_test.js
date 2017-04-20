var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);

import type {IRealm}                from '../../src/domain/interface';
import type {IClaim}                from '../../src/domain/interface';
import {RealmRepositorySqlite}      from '../../src/repository/sqlite/realm_repository';
import {ClaimRepositorySqlite}      from '../../src/repository/sqlite/claim_repository';
import {PrincipalRepositorySqlite}  from '../../src/repository/sqlite/principal_repository';
import {RoleRepositorySqlite}       from '../../src/repository/sqlite/role_repository';
import {DBHelper}                   from '../../src/repository/sqlite/db_helper';
import {QueryOptions}               from '../../src/repository/interface';
import {Claim}                      from '../../src/domain/claim';
import {Realm}                      from '../../src/domain/realm';
import {Role}                       from '../../src/domain/role';
import {Principal}                  from '../../src/domain/principal';
import {PersistenceError}           from '../../src/repository/persistence_error';
import {DefaultSecurityCache}       from '../../src/cache/security_cache';

describe('ClaimRepository', function() {
  let dbHelper:             DBHelper;
  let claimRepository:      ClaimRepositorySqlite;
  let realmRepository:      RealmRepositorySqlite;
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
        let realm  = await this.realmRepository.save(new Realm(`random-domain_${Math.random()}`));
        let claim  = await this.claimRepository.save(new Claim(realm, 'action', 'resource', 'x = y'));
        let loaded = await this.claimRepository.findById(claim.id);
        assert.equal('action', loaded.action);
        assert.equal('resource', loaded.resource);
        assert.equal('x = y', loaded.condition);
    });
  });


  describe('#saveAndRemoveGetById', function() {
    it('should be able to save and remove claim by id', async function() {
        let realm   = await this.realmRepository.save(new Realm(`random-domain_${Math.random()}`));
        let claim   = await this.claimRepository.save(new Claim(realm, 'action', 'resource', 'x = y'));
        let removed = await this.claimRepository.removeById(claim.id);
        assert.equal(true, removed);
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

  describe('#__savePrincipalClaims', function() {
    it('should be able to save claims to principal', async function() {
        let realm     = await this.realmRepository.save(new Realm(`random-domain_${Math.random()}`));
        let principal = await this.principalRepository.save(new Principal(realm, 'xuser'));
        principal.claims.add(new Claim(principal.realm, 'read', 'resource1', 'a = b'));
        principal.claims.add(new Claim(principal.realm, 'write', 'resource2', 'c = d'));
        principal.claims.add(new Claim(principal.realm, 'delete', 'resource3', 'e = f'));
        principal     = await this.claimRepository.__savePrincipalClaims(principal);
        assert.equal(3, principal.claims.length, `incorrect claims principal ${principal}`);
        principal.claims.add(new Claim(principal.realm, 'view', 'resource4', 'g = h'));
        await this.principalRepository.save(principal);
        let loaded    = await this.principalRepository.findByName(realm.realmName, principal.principalName);
        assert.equal(4, loaded.claims.length);
    });
  });


  describe('#__savePrincipalClaims', function() {
    it('should be able to remove claims to principal', async function() {
        let realm     = await this.realmRepository.save(new Realm(`random-domain_${Math.random()}`));
        let principal = await this.principalRepository.save(new Principal(realm, 'xuser'));
        principal.claims.add(new Claim(principal.realm, 'read', 'resource1', 'a = b'));
        principal.claims.add(new Claim(principal.realm, 'write', 'resource2', 'c = d'));
        principal.claims.add(new Claim(principal.realm, 'delete', 'resource3', 'e = f'));
        principal     = await this.claimRepository.__savePrincipalClaims(principal);
        assert.equal(3, principal.claims.length);
        principal.claims.length = 0;
        await this.claimRepository.__savePrincipalClaims(principal);
        let loaded    = await this.principalRepository.findByName(realm.realmName, principal.principalName);
        assert.equal(0, loaded.claims.length);
    });
  });

    describe('#__saveRoleClaims', function() {
      it('should be able to save claims to role', async function() {
          let realm     = await this.realmRepository.save(new Realm(`random-domain_${Math.random()}`));
          let role      = await this.roleRepository.save(new Role(realm, 'admin-role'));

          role.claims.add(new Claim(role.realm, 'read', 'resource1', 'a = b'));
          role.claims.add(new Claim(role.realm, 'write', 'resource2', 'c = d'));
          role.claims.add(new Claim(role.realm, 'delete', 'resource3', 'e = f'));
          role     = await this.claimRepository.__saveRoleClaims(role);

          assert.equal(3, role.claims.length);
          role.claims.add(new Claim(role.realm, 'view', 'resource4', 'g = h'));
          await this.claimRepository.__saveRoleClaims(role);
          let loaded    = await this.roleRepository.findByName(realm.realmName, role.roleName);
          assert.equal(4, loaded.claims.length);
      });
    });


    describe('#__saveRoleClaims', function() {
      it('should be able to remove claims to role', async function() {
          let realm     = await this.realmRepository.save(new Realm(`random-domain_${Math.random()}`));
          let role      = await this.roleRepository.save(new Role(realm, 'admin-role'));

          role.claims.add(new Claim(role.realm, 'read', 'resource1', 'a = b'));
          role.claims.add(new Claim(role.realm, 'write', 'resource2', 'c = d'));
          role.claims.add(new Claim(role.realm, 'delete', 'resource3', 'e = f'));
          role     = await this.claimRepository.__saveRoleClaims(role);
          assert.equal(3, role.claims.length);
          role.claims.length = 0;
          await this.claimRepository.__saveRoleClaims(role);
          let loaded    = await this.roleRepository.findByName(realm.realmName, role.roleName);
          assert.equal(0, loaded.claims.length);
      });
    });

    describe('#saveClaimToPrincipalAndRole', function() {
      it('should be able to save claims to principal and role', async function() {
          let realm     = await this.realmRepository.save(new Realm(`random-domain_${Math.random()}`));

          let principal = new Principal(realm, 'xuser');

          principal.claims.add(new Claim(principal.realm, 'read', 'file', 'a = b'));
          principal.claims.add(new Claim(principal.realm, 'write', 'file', 'c = d'));
          principal.claims.add(new Claim(principal.realm, 'delete', 'file', 'e = f'));

          for (let i = 0; i < 3; i++) {
              let role          = new Role(realm, `admin-role_${i}`);
              role.claims.add(new Claim(principal.realm, 'read', 'url', 'a = b'));
              role.claims.add(new Claim(principal.realm, 'write', 'url', 'c = d'));
              role.claims.add(new Claim(principal.realm, 'delete', 'url', 'e = f'));

              await this.roleRepository.save(role);
              principal.roles.add(role);
          }
          principal = await this.principalRepository.save(principal);
          //
          let loaded    = await this.principalRepository.findByName(realm.realmName, principal.principalName);
          assert.equal(3, loaded.claims.length);
          assert.equal(3, loaded.roles.length);
          loaded.roles.forEach(role => {
              assert.equal(3, role.claims.length);
          })
      });
    });
});
