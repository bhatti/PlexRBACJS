var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);

const Role              = require('../../src/domain/role');
const Claim             = require('../../src/domain/claim');
const RoleRepository    = require('../../src/repository/role_repository');
const PersistenceError  = require('./../../src/repository/persistence_error');
const RepositoryLocator = require('../../src/repository/repository_locator');

// https://coveralls.io/repos/new 
//
describe('RoleRepository', function() {
    before(function(done) {
        this.repositoryLocator = new RepositoryLocator('localhost', 6379, done);
    });

    after(function(done) {
        this.repositoryLocator.close();
        done();
    });

    describe('#find', function() {
        it('should not be able to find role without saving', async function() {
            let realm  = `domain_${Math.random()}`;
            try {
                await this.repositoryLocator.roleRepository.findByRoleNames(realm, 'non-existing-role');
                assert(false, 'should have failed');
            } catch (e) {
            }
        });
    });

    describe('#findByRealm', function() {
        it('should not be able to find role by realm without saving', async function() {
            let realm  = `domain_${Math.random()}`;
            let all = await this.repositoryLocator.roleRepository.findByRealm(realm);
            assert.equal(0, all.length);
        });
    });

    describe('#save', function() {
        it('should be able to save', async function() {
            let realm  = `domain_${Math.random()}`;
            let admin = await this.repositoryLocator.roleRepository.save(new Role(realm, 'Admin'));
            assert.equal('Admin', admin.roleName);
            let all = await this.repositoryLocator.roleRepository.findByRealm(realm);
            assert.equal(1, all.length);
        });
    });

    describe('#saveAndFind', function() {
        it('should be able to get role by id after saving', async function() {
            let realm  = `domain_${Math.random()}`;
            let manager = await this.repositoryLocator.roleRepository.save(new Role(realm, 'Manager'));
            let all = await this.repositoryLocator.roleRepository.findByRoleNames(realm, manager.roleName);
            assert.equal(1, all.length);
            assert.equal('Manager', all[0].roleName);
            assert.equal(realm, all[0].realm);
            //
            let admin = new Role(realm, 'Admin');
            admin.parents.add(manager);
            admin = await this.repositoryLocator.roleRepository.save(admin);
            //
            all = await this.repositoryLocator.roleRepository.findByRealm(realm);
            assert.equal(2, all.length);
            //
            all = await this.repositoryLocator.roleRepository.findByRoleNames(realm, admin.roleName);
            assert.equal(1, all.length);
            assert.equal('Admin', all[0].roleName);
            assert.equal(realm, all[0].realm); 
            assert.equal(1, all[0].parents.length);
            assert.equal('Manager', all[0].parents[0].roleName);
            //
            //
            all = await this.repositoryLocator.roleRepository.findByRoleNames(realm, admin.roleName, manager.roleName);
            assert.equal(2, all.length);
            all = await this.repositoryLocator.roleRepository.findByRealm(realm);
            assert.equal(2, all.length);
        });
    });

    describe('#saveAndRemove', function() {
        it('should be able to save and remove role by id', async function() {
            let realm  = `domain_${Math.random()}`;
            //
            let employee = await this.repositoryLocator.roleRepository.save(new Role(realm, 'Employee'));
            let manager = new Role(realm, 'Manager');
            manager.parents.add(employee);
            await this.repositoryLocator.roleRepository.save(manager); 
            //
            let all = await this.repositoryLocator.roleRepository.findByRoleNames(realm, manager.roleName);
            assert.equal(1, all.length);
            assert.equal('Manager', all[0].roleName);
            assert.equal(1, all[0].parents.length);
            //
            let removed = this.repositoryLocator.roleRepository.remove(employee);
            assert.ok(removed); 
            //
            all = await this.repositoryLocator.roleRepository.findByRoleNames(realm, employee.roleName);
            assert.equal(0, all.length);
            //
            all = await this.repositoryLocator.roleRepository.findByRealm(realm);
            assert.equal(1, all.length);
            //
            all = await this.repositoryLocator.roleRepository.findByRoleNames(realm, manager.roleName);
            assert.equal(1, all.length);
            assert.equal('Manager', all[0].roleName);
            assert.equal(0, all[0].parents.length);
        });
    });


    describe('#find', function() {
        it('should not be able to get role by unknown name', async function() {
            this.repositoryLocator.roleRepository.findByRoleNames('non-existing-realm-name', 'unknown-role').then(x => {
                assert(false, 'should not return role');
            }).catch(e => {
            });
        });
    });

    describe('#AddRoleParents', function() {
        it('should be able to add roles as parents', async function() {
            let realm  = `domain_${Math.random()}`;
            let child = new Role(realm, 'tech-manager');
            let parentNames = ['tech-support', 'senior-tech-support', 'receptionist'];
            for (var i=0; i<parentNames.length; i++) {
                child.parents.add(await this.repositoryLocator.roleRepository.save(new Role(realm, parentNames[i])));
            }
            await this.repositoryLocator.roleRepository.save(child);
            //
            let all = await this.repositoryLocator.roleRepository.findByRoleNames(realm, child.roleName);
            assert.equal(1, all.length);
            assert.equal(3, all[0].parents.length);
            assert.equal('tech-manager', all[0].roleName);
            child.parents.forEach(parent => {
                assert.ok(parentNames.includes(parent.roleName), `Could not find ${String(parent)} in ${String(all[0].parents)}`);
            });
        });
    });

    describe('#RemoveRoleParents', function() {
        it('should be able to remove roles as parents', async function() {
            let realm  = `domain_${Math.random()}`;
            let child = new Role(realm, 'tech-manager');
            let parentNames = ['tech-support', 'senior-tech-support', 'receptionist'];
            for (var i=0; i<parentNames.length; i++) {
                child.parents.add(await this.repositoryLocator.roleRepository.save(new Role(realm, parentNames[i])));
            }
            await this.repositoryLocator.roleRepository.save(child);
            child.parents.delete(new Role(realm, 'tech-support'));
            await this.repositoryLocator.roleRepository.save(child);
            //
            let all = await this.repositoryLocator.roleRepository.findByRoleNames(realm, child.roleName);
            assert.equal(1, all.length);
            assert.equal(2, all[0].parents.length);
            assert.equal('tech-manager', all[0].roleName);
            child.parents.forEach(parent => {
                assert.ok(parentNames.includes(parent.roleName), `Could not find ${String(parent)} in ${String(all[0].parents)}`);
            });
        });
    });

    describe('#claims', function() {
        it('should be able to get claims by for all parents', async function() {
            let realm  = `domain_${Math.random()}`;
            let child = new Role(realm, 'tech-manager');
            child.claims.add(new Claim(realm, 'upgrade', 'url', `a = b`));
            let parentNames = ['tech-support', 'senior-tech-support', 'receptionist'];
            let parentClaims = [new Claim(realm, 'read', 'url', `a = b`), new Claim(realm, 'write', 'url', `a = b`), new Claim(realm, 'update', 'url', `a = b`)];
            for (var i=0; i<parentNames.length; i++) {
                let parent = new Role(realm, parentNames[i]);
                for (var j=0; j<parentClaims.length; j++) {
                    parent.claims.add(parentClaims[j]);
                }
                child.parents.add(await this.repositoryLocator.roleRepository.save(parent));
            }
            await this.repositoryLocator.roleRepository.save(child);
            //
            let all = await this.repositoryLocator.roleRepository.findByRoleNames(realm, child.roleName);
            assert.equal(1, all.length);
            assert.equal(3, all[0].parents.length);
            assert.equal('tech-manager', all[0].roleName);
            assert.equal(4, all[0].allClaims().length);
        });
    });

    describe('#claims', function() {
        it('should be able to update claims', async function() {
            let realm  = `domain_${Math.random()}`;
            let employee = new Role(realm, 'Employee');
            employee.claims.add(new Claim(realm, 'login', 'intranet', `between 9am and 5pm`));
            await this.repositoryLocator.roleRepository.save(employee);
            //
            let manager = new Role(realm, 'Manager');
            manager.parents.add(employee);
            manager.claims.add(new Claim(realm, 'login', 'intranet'));
            await this.repositoryLocator.roleRepository.save(manager);
            //
            let admin = new Role(realm, 'Admin');
            admin.parents.add(manager);
            admin.claims.add(new Claim(realm, 'create|update|delete', 'users'));
            await this.repositoryLocator.roleRepository.save(admin);

            let all = await this.repositoryLocator.roleRepository.findByRoleNames(realm, admin.roleName);
            assert.equal(1, all.length);
            assert.equal(1, all[0].parents.length);
            assert.equal('Admin', all[0].roleName);
            assert.equal(3, all[0].allClaims().length);
        });
    });

    describe('#save', function() {
        it('should be able to save parents by names', async function() {
            let realm  = `domain_${Math.random()}`;
            let employee = new Role(realm, 'Employee');
            employee.claims.add(new Claim(realm, 'login', 'intranet', `between 9am and 5pm`));
            await this.repositoryLocator.roleRepository.save(employee);
            //
            let manager = new Role(realm, 'Manager');
            manager.parents.add(employee.roleName);
            manager.claims.add(new Claim(realm, 'login', 'intranet'));
            await this.repositoryLocator.roleRepository.save(manager);
            //
            let all = await this.repositoryLocator.roleRepository.findByRoleNames(realm, manager.roleName);
            assert.equal(1, all.length);
            assert.equal(1, all[0].parents.length);
            assert.equal('Manager', all[0].roleName);
            assert.equal(2, all[0].allClaims().length);
        });
    });
});
