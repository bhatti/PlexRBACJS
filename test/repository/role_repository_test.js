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
import {RepositoryLocator}          from '../../src/repository/repository_locator';
import {QueryOptions}               from '../../src/repository/interface';
import {Role}                       from '../../src/domain/role';
import {Realm}                      from '../../src/domain/realm';
import {Principal}                  from '../../src/domain/principal';
import {PersistenceError}           from '../../src/repository/persistence_error';
import {DefaultSecurityCache}       from '../../src/cache/security_cache';


describe('RoleRepository', function() {
	let repositoryLocator: RepositoryLocator;

	before(function(done) {
	  this.repositoryLocator = new RepositoryLocator('sqlite', ':memory:', done);
	});

	  after(function(done) {
		this.repositoryLocator.dbFactory.close();
		done();
	  });

	  describe('#saveGetById', function() {
		it('should not be able to get role by id without saving', async function() {
			try {
				let role = await this.repositoryLocator.roleRepository.findById(1000);
				await role;
				assert(false, 'should not return role');
			} catch(err) {
			}
		});
	  });

	  describe('#saveGetById', function() {
		it('should be able to get role by id after saving', async function() {
			let realm  = await this.repositoryLocator.realmRepository.save(new Realm(`random-domain_${Math.random()}`));
			let saved  = await this.repositoryLocator.roleRepository.save(new Role(realm, 'admin-role'));
			let loaded = await this.repositoryLocator.roleRepository.findById(saved.id);
			assert.equal('admin-role', loaded.roleName);
			assert.equal(realm.realmName, loaded.realm().realmName);
		});
	  });


	  describe('#saveAndRemoveGetById', function() {
		it('should be able to save and remove role by id', async function() {
			let realm  = await this.repositoryLocator.realmRepository.save(new Realm(`random-domain_${Math.random()}`));
			let saved  = await this.repositoryLocator.roleRepository.save(new Role(realm, 'admin-role'));
			let removed = this.repositoryLocator.roleRepository.removeById(saved.id);
			assert.ok(removed);
			try {
				let role = await this.repositoryLocator.roleRepository.findById(saved.id);
				await role;
				assert(false, 'should not return role');
			} catch(err) {
			}
		});
	  });


	  describe('#saveGetByName', function() {
		it('should be able to get role by name after saving', async function() {
			let realm  = await this.repositoryLocator.realmRepository.save(new Realm(`random-domain_${Math.random()}`));
			let saved  = await this.repositoryLocator.roleRepository.save(new Role(realm, 'manager-role'));
			let loaded = await this.repositoryLocator.roleRepository.findByName(saved.realm().realmName, saved.roleName);
			assert.equal(saved.roleName, loaded.roleName);
			assert.equal(realm.realmName, loaded.realm().realmName);
		});
	  });

	  describe('#saveGetByName', function() {
		it('should not be able to get role by unknown name', async function() {
			try {
				let role = await this.repositoryLocator.roleRepository.findByName('non-existing-realm-name', 'unknown-role').
				assert(false, 'should not return role');
			} catch(err) {
			}
		});
	  });

	  describe('#saveRoleParents', function() {
		it('should be able to add roles as parents', async function() {
			//
			let realm    = await this.repositoryLocator.realmRepository.save(new Realm(`random-domain_${Math.random()}`));
			let child = new Role(realm, 'tech-manager');
			child.parents.add(new Role(realm, 'tech-support'));
			child.parents.add(new Role(realm, 'senior-tech-support'));
			child.parents.add(new Role(realm, 'receptionist'));
			//
			await this.repositoryLocator.roleRepository.save(child);
			//
			let loaded      = await this.repositoryLocator.roleRepository.findById(child.id);
			assert.equal(3, loaded.parents.length);
			assert.equal('tech-manager', loaded.roleName);
			child.parents.forEach(parent => {
				assert.ok(loaded.parents.exists(parent), `Could not find ${String(parent)} in ${String(loaded.parents)}`);
			});
		});
	  });

	  describe('#saveRoleParents', function() {
		it('should be able to remove roles as parents', async function() {
			//
			let realm    = await this.repositoryLocator.realmRepository.save(new Realm(`random-domain_${Math.random()}`));
			let child = new Role(realm, 'tech-manager');
			child.parents.add(new Role(realm, 'tech-support'));
			child.parents.add(new Role(realm, 'senior-tech-support'));
			child.parents.add(new Role(realm, 'receptionist'));
			//
			await this.repositoryLocator.roleRepository.save(child);
			child.parents.delete(new Role(realm, 'tech-support'));
			await this.repositoryLocator.roleRepository.save(child);
			//
			let loaded      = await this.repositoryLocator.roleRepository.findById(child.id);
			assert.equal(2, loaded.parents.length);

			assert.equal('tech-manager', loaded.roleName);
			child.parents.forEach(parent => {
				assert.ok(loaded.parents.exists(parent), `Could not find ${String(parent.roles)} in ${String(loaded)}`);
			});
		});
	  });

	  describe('#__savePrincipalRoles', function() {
		it('should be able to save roles for principal only if current date is effective', async function() {
			let rolesNames = ['tech-support', 'senior-tech-support', 'receptionist'];
			let realm      = await this.repositoryLocator.realmRepository.save(new Realm(`random-domain_${Math.random()}`));
			let principal  = await this.repositoryLocator.principalRepository.save(new Principal(realm, 'johnd'));

			let savePromises = [];
			rolesNames.forEach(async name => {
				let role = new Role(realm, name, new Date(0), new Date(0));
				savePromises.push(this.repositoryLocator.roleRepository.save(role).then(role => {
					principal.roles.add(role);
				}));
			});
			await Promise.all(savePromises);

			//
			this.repositoryLocator.roleRepository.__savePrincipalRoles(principal);
			let loaded      = await this.repositoryLocator.principalRepository.findById(principal.id);
			assert.equal(0, loaded.roles.length);
		});
	  });

	  describe('#__savePrincipalRoles', function() {
		it('should be able to save roles for principal', async function() {
			let rolesNames = ['tech-support', 'senior-tech-support', 'receptionist'];
			let realm      = await this.repositoryLocator.realmRepository.save(new Realm(`random-domain_${Math.random()}`));
			let principal  = await this.repositoryLocator.principalRepository.save(new Principal(realm, 'johnd'));

			let savePromises = [];
			rolesNames.forEach(async name => {
				savePromises.push(this.repositoryLocator.roleRepository.save(new Role(realm, name)).then(role => {
					principal.roles.add(role);
				}));
			});
			await Promise.all(savePromises);

			//
			this.repositoryLocator.roleRepository.__savePrincipalRoles(principal);
			let loaded      = await this.repositoryLocator.principalRepository.findById(principal.id);
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
			let realm      = await this.repositoryLocator.realmRepository.save(new Realm(`random-domain_${Math.random()}`));
			let principal  = await this.repositoryLocator.principalRepository.save(new Principal(realm, 'johnd'));

			let savePromises = [];
			rolesNames.forEach(async name => {
				savePromises.push(this.repositoryLocator.roleRepository.save(new Role(realm, name)).then(role => {
					principal.roles.add(role);
				}));
			});
			await Promise.all(savePromises);
			//
			this.repositoryLocator.roleRepository.__savePrincipalRoles(principal);
			assert.equal(3, principal.roles.length);
			principal.roles.length = 0;

			this.repositoryLocator.roleRepository.__savePrincipalRoles(principal);
			let loaded      = await this.repositoryLocator.principalRepository.findById(principal.id);
			assert.equal(0, loaded.roles.length);
		});
	  });

	  describe('#__loadPrincipalRoles', function() {
		it('should be able to load roles for principal', async function() {
			let rolesNames = ['tech-support', 'senior-tech-support', 'receptionist'];
			let realm      = await this.repositoryLocator.realmRepository.save(new Realm(`random-domain_${Math.random()}`));
			let principal  = new Principal(realm, 'johnd');

			rolesNames.forEach(async name => {
				let role = await this.repositoryLocator.roleRepository.save(new Role(realm, name));
				principal.roles.add(role);
			});
			principal       = await this.repositoryLocator.principalRepository.save(principal);
			// TODO fix this
			//assert.equal(rolesNames.length, principal.roles.size, `principal roles ${JSON.stringify(principal.roles)}`);
		});
	  });


	  describe('#search', function() {
		it('should be able to search domain by name', async function() {
			let realm  = await this.repositoryLocator.realmRepository.save(new Realm(`random-domain_${Math.random()}`));
			let saved  = await this.repositoryLocator.roleRepository.save(new Role(realm, 'search-role'));

			let criteria    = new Map();
			criteria.set('role_name', 'search-role');
			let results = await this.repositoryLocator.roleRepository.search(criteria);
			assert.equal(1, results.length);
			assert.equal('search-role', results[0].roleName);
		});
	  });


	  describe('#removeById', function() {
		it('should fail because of unknown id', async function() {
			let removed = await this.repositoryLocator.roleRepository.removeById(1000);
			assert.ok(removed);
		});
	  });
});
