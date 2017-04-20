var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);

import type {IRealm}                from '../../src/domain/interface';
import type {IRole}                 from '../../src/domain/interface';
import {RealmRepositorySqlite}      from '../../src/repository/sqlite/realm_repository';
import {RoleRepositorySqlite}       from '../../src/repository/sqlite/role_repository';
import {ClaimRepositorySqlite}      from '../../src/repository/sqlite/claim_repository';
import {PrincipalRepositorySqlite}  from '../../src/repository/sqlite/principal_repository';
import {DBFactory}                  from '../../src/repository/sqlite/db_factory';
import {QueryOptions}               from '../../src/repository/interface';
import {Role}                       from '../../src/domain/role';
import {Realm}                      from '../../src/domain/realm';
import {Principal}                  from '../../src/domain/principal';
import {PersistenceError}           from '../../src/repository/persistence_error';
import {DefaultSecurityCache}       from '../../src/cache/security_cache';


describe('RoleRepository', function() {
  let dbFactory:        DBFactory;
  let roleRepository:   RoleRepositorySqlite;
  let realmRepository:  RealmRepositorySqlite;
  let claimRepository:  ClaimRepositorySqlite;
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
    it('should not be able to get role by id without saving', async function() {
        try {
            let role = await this.roleRepository.findById(1000);
            await role;
            assert(false, 'should not return role');
        } catch(err) {
        }
    });
  });

  describe('#saveGetById', function() {
    it('should be able to get role by id after saving', async function() {
        let realm  = await this.realmRepository.save(new Realm(`random-domain_${Math.random()}`));
        let saved  = await this.roleRepository.save(new Role(realm, 'admin-role'));
        let loaded = await this.roleRepository.findById(saved.id);
        assert.equal('admin-role', loaded.roleName);
        assert.equal(realm.realmName, loaded.realm.realmName);
    });
  });


  describe('#saveAndRemoveGetById', function() {
    it('should be able to save and remove role by id', async function() {
        let realm  = await this.realmRepository.save(new Realm(`random-domain_${Math.random()}`));
        let saved  = await this.roleRepository.save(new Role(realm, 'admin-role'));
        let removed = this.roleRepository.removeById(saved.id);
        assert.ok(removed);
        try {
            let role = await this.roleRepository.findById(saved.id);
            await role;
            assert(false, 'should not return role');
        } catch(err) {
        }
    });
  });


  describe('#saveGetByName', function() {
    it('should be able to get role by name after saving', async function() {
        let realm  = await this.realmRepository.save(new Realm(`random-domain_${Math.random()}`));
        let saved  = await this.roleRepository.save(new Role(realm, 'manager-role'));
        let loaded = await this.roleRepository.findByName(saved.realm.realmName, saved.roleName);
        assert.equal(saved.roleName, loaded.roleName);
        assert.equal(realm.realmName, loaded.realm.realmName);
    });
  });

  describe('#saveGetByName', function() {
    it('should not be able to get role by unknown name', async function() {
        try {
            let role = await this.roleRepository.findByName('non-existing-realm-name', 'unknown-role').
            assert(false, 'should not return role');
        } catch(err) {
        }
    });
  });

  describe('#addParentsToRole', function() {
    it('should be able to add roles as parents', async function() {
        let parentNames = ['tech-support', 'senior-tech-support', 'receptionist'];
        let childName = ['tech-manager'];
        let allRoles = [...parentNames, ...childName];
        //
        let realm    = await this.realmRepository.save(new Realm(`random-domain_${Math.random()}`));
        let allSaved = [];
        allRoles.forEach(async name => {
            allSaved.push(this.roleRepository.save(new Role(realm, name)));
        });
        await Promise.all(allSaved);
        //
        let parents     = [await allSaved[0], await allSaved[1], await allSaved[2]];
        let child       = await allSaved[3];
        //
        await this.roleRepository.addParentsToRole(child, parents);
        let loaded      = await this.roleRepository.findById(child.id);
        let loadedParents = [];
        loaded.parents.forEach(p => {
            loadedParents.push(p.roleName);
        });
        //
        assert.equal(childName, loaded.roleName);
        assert.equal(parentNames.length, loadedParents.length);
        parentNames.forEach(parent => {
            assert.ok(loadedParents.includes(parent), `Could not find ${parent} in ${loadedParents}`);
        });
    });
  });

 describe('#removeParentsToRole', function() {
    it('should be able to remove roles as parents', async function() {
        let parentNames = ['tech-support', 'senior-tech-support', 'receptionist'];
        let childName = ['tech-manager'];
        let allRoles = [...parentNames, ...childName];
        //
        let realm    = await this.realmRepository.save(new Realm(`random-domain_${Math.random()}`));
        let allSaved = [];
        allRoles.forEach(async name => {
            allSaved.push(this.roleRepository.save(new Role(realm, name)));
        });
        await Promise.all(allSaved);
        //
        let parents     = [await allSaved[0], await allSaved[1], await allSaved[2]];
        let child       = await allSaved[3];
        //
        await this.roleRepository.addParentsToRole(child, parents);

        let toRemoveParent = parents.values().next().value;
        let ndx = parents.indexOf(toRemoveParent);
        if (ndx != -1) {
            parents.splice(ndx, 1);
        }
        //
        await this.roleRepository.removeParentsFromRole(child, [toRemoveParent]);
        let loaded      = await this.roleRepository.findById(child.id);
        //
        let loadedParents = [];
        loaded.parents.forEach(p => {
            loadedParents.push(p.roleName);
        });
        //
        assert.equal(childName, loaded.roleName);
        assert.equal(parentNames.length-1, loadedParents.length);
        parentNames.forEach(parent => {
            if (parent == toRemoveParent.roleName) {
                assert.notOk(loadedParents.includes(parent), `Found ${parent} in ${loadedParents}`);
            } else {
                assert.ok(loadedParents.includes(parent), `Could not find ${parent} in ${loadedParents}`);
            }
        });
    });
  });


  describe('#__savePrincipalRoles', function() {
    it('should be able to save roles for principal only if current date is effective', async function() {
        let rolesNames = ['tech-support', 'senior-tech-support', 'receptionist'];
        let realm      = await this.realmRepository.save(new Realm(`random-domain_${Math.random()}`));
        let principal  = await this.principalRepository.save(new Principal(realm, 'johnd'));

        let savePromises = [];
        rolesNames.forEach(async name => {
            let role = new Role(realm, name);
            role.startDate = new Date(0);
            role.endDate = new Date(0);
            savePromises.push(this.roleRepository.save(role).then(role => {
                principal.roles.add(role);
            }));
        });
        await Promise.all(savePromises);

        //
        this.roleRepository.__savePrincipalRoles(principal);
        let loaded      = await this.principalRepository.findById(principal.id);
        assert.equal(0, loaded.roles.length);
    });
  });

  describe('#__savePrincipalRoles', function() {
    it('should be able to save roles for principal', async function() {
        let rolesNames = ['tech-support', 'senior-tech-support', 'receptionist'];
        let realm      = await this.realmRepository.save(new Realm(`random-domain_${Math.random()}`));
        let principal  = await this.principalRepository.save(new Principal(realm, 'johnd'));

        let savePromises = [];
        rolesNames.forEach(async name => {
            savePromises.push(this.roleRepository.save(new Role(realm, name)).then(role => {
                principal.roles.add(role);
            }));
        });
        await Promise.all(savePromises);

        //
        this.roleRepository.__savePrincipalRoles(principal);
        let loaded      = await this.principalRepository.findById(principal.id);
        assert.equal(3, loaded.roles.length);
        //
        let loadedRoles = [];
        loaded.roles.forEach(r => {
            loadedRoles.push(r.roleName);
        });
        //
        assert.equal(3, loadedRoles.length);
        principal.roles.forEach(role => {
            assert.ok(loadedRoles.includes(role.roleName), `Could not find ${role.roleName} in ${loadedRoles}`);
        });
    });
  });

  describe('#__savePrincipalRoles', function() {
    it('should be able to remove roles from principal', async function() {

        let rolesNames = ['tech-support', 'senior-tech-support', 'receptionist'];
        let realm      = await this.realmRepository.save(new Realm(`random-domain_${Math.random()}`));
        let principal  = await this.principalRepository.save(new Principal(realm, 'johnd'));

        let savePromises = [];
        rolesNames.forEach(async name => {
            savePromises.push(this.roleRepository.save(new Role(realm, name)).then(role => {
                principal.roles.add(role);
            }));
        });
        await Promise.all(savePromises);
        //
        this.roleRepository.__savePrincipalRoles(principal);
        assert.equal(3, principal.roles.length);
        principal.roles.length = 0;

        this.roleRepository.__savePrincipalRoles(principal);
        let loaded      = await this.principalRepository.findById(principal.id);
        assert.equal(0, loaded.roles.length);
    });
  });

  describe('#__loadPrincipalRoles', function() {
    it('should be able to load roles for principal', async function() {
        let rolesNames = ['tech-support', 'senior-tech-support', 'receptionist'];
        let realm      = await this.realmRepository.save(new Realm(`random-domain_${Math.random()}`));
        let principal  = new Principal(realm, 'johnd');

        rolesNames.forEach(async name => {
            let role = await this.roleRepository.save(new Role(realm, name));
            principal.roles.add(role);
        });
        principal       = await this.principalRepository.save(principal);
        // TODO fix this
        //assert.equal(rolesNames.length, principal.roles.size, `principal roles ${JSON.stringify(principal.roles)}`);
    });
  });


  describe('#search', function() {
    it('should be able to search domain by name', async function() {
        let realm  = await this.realmRepository.save(new Realm(`random-domain_${Math.random()}`));
        let saved  = await this.roleRepository.save(new Role(realm, 'search-role'));

        let criteria    = new Map();
        criteria.set('role_name', 'search-role');
        let results = await this.roleRepository.search(criteria);
        assert.equal(1, results.length);
        assert.equal('search-role', results[0].roleName);
    });
  });


  describe('#removeById', function() {
    it('should fail because of unknown id', async function() {
        let removed = await this.roleRepository.removeById(1000);
        assert.ok(removed);
    });
  });

});
