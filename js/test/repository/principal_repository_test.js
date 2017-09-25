var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);

const Role              = require('../../src/domain/role');
const Claim             = require('../../src/domain/claim');
const Limits            = require('../../src/domain/limits');
const Principal         = require('../../src/domain/principal');
const RoleRepository    = require('../../src/repository/role_repository');
const PrincipalRepository    = require('../../src/repository/principal_repository');
const PersistenceError  = require('./../../src/repository/persistence_error');
const RepositoryLocator = require('../../src/repository/repository_locator');


describe('PrincipalRepository', function() {
    before(function(done) {
        this.repositoryLocator = new RepositoryLocator('localhost', 6379, done);
    });

    after(function(done) {
        this.repositoryLocator.close();
        done();
    });

    describe('#findByPrincipalName', function() {
        it('should not be able to get principal by id without saving', async function() {
            let principal = await this.repositoryLocator.principalRepository.findByPrincipalName('realm', 'xxx');
            assert.notOk(principal);
        });
    });

    describe('#save', function() {
        it('should be able to save a principal', async function() {
            let realm  = `domain_${Math.random()}`;
            let saved  = await this.repositoryLocator.principalRepository.save(new Principal(realm, 'admin', {'name': 'bob', 'age':31}));
            assert.equal('admin', saved.principalName);
        });
    });


    describe('#saveFindByPrincipalName', function() {
        it('should be able to get principal by principal-name after saving', async function() {
            let realm  = `domain_${Math.random()}`;
            let saved  = await this.repositoryLocator.principalRepository.save(new Principal(realm, 'superuser', {'name': 'barry', 'age':31}));
            let loaded = await this.repositoryLocator.principalRepository.findByPrincipalName(realm, saved.principalName);
            assert.equal('superuser', loaded.principalName);
            assert.equal('barry', loaded.properties.name);
            assert.equal(31, loaded.properties.age);
        });
    });


    describe('#increment', function() {
        it('should not be able to increment limits usage for unknown user', async function() {
            let realm  = `domain_${Math.random()}`;
            let jay = new Principal(realm, 'jay', {'age':31});
            assert.notOk(await this.repositoryLocator.principalRepository.increment(jay, 'type', 'borrow'));
        });
    });



    describe('#increment', function() {
        it('should not be able to increment limits usage for unknown limit', async function() {
            let realm  = `domain_${Math.random()}`;
            let jay = new Principal(realm, 'jay', {'age':31});
            await this.repositoryLocator.principalRepository.save(jay);
            assert.notOk(await this.repositoryLocator.principalRepository.increment(jay, 'type', 'borrow'));
        });
    });


    describe('#increment', function() {
        it('should be able to increment limits usage', async function() {
            let realm  = `domain_${Math.random()}`;
            let jay = new Principal(realm, 'jay', {'age':31});
            jay.limits.add(new Limits('type', 'borrow', 100, 0));
            await this.repositoryLocator.principalRepository.save(jay);
            assert.ok(await this.repositoryLocator.principalRepository.increment(jay, 'type', 'borrow'));
            let loaded = await this.repositoryLocator.principalRepository.findByPrincipalName(realm, jay.principalName);
            assert.equal('jay', loaded.principalName);
            assert.equal(1, loaded.limits[0].value);
        });
    });

    /*
    describe('#increment', function() {
        it('should be able to increment using counter rather using cached value', async function() {
            let realm  = `domain_${Math.random()}`;
            let jay = new Principal(realm, 'jay', {'age':31});
            jay.limits.add(new Limits('type', 'borrow', 100, 10));
            await this.repositoryLocator.principalRepository.save(jay);
            assert.ok(await this.repositoryLocator.principalRepository.increment(jay, 'type', 'borrow'));
            let loaded = await this.repositoryLocator.principalRepository.findByPrincipalName(realm, jay.principalName);
            assert.equal('jay', loaded.principalName);
            assert.equal(1, loaded.limits[0].value);
        });
    });
*/

    describe('#saveMultipleAndFindByRealm', function() {
        it('should be able to get principal by principal-name after saving', async function() {
            let realm  = `domain_${Math.random()}`; 
            for (var i=0; i<10; i++) {
                await this.repositoryLocator.principalRepository.save(new Principal(realm, `user_${i}`, {'age':31+i}));
            }
            let all = await this.repositoryLocator.principalRepository.findByRealm(realm);
            assert.equal(10, all.length);
        });
    });


    describe('#saveAndRemoveGetByPrincipalName', function() {
        it('should be able to save and remove principal by principal-name', async function() {
            let realm  = `domain_${Math.random()}`;
            let saved   = await this.repositoryLocator.principalRepository.save(new Principal(realm, 'dan'));
            let removed = await this.repositoryLocator.principalRepository.remove(saved);
            assert.equal(true, removed);

            try {
                let principal = await this.repositoryLocator.principalRepository.findByPrincipalName(realm, saved.principalName);
                assert(false, 'should not return principal');
            } catch(err) {
            }
        });
    }); 

    describe('#roleClaims', function() {
        it('should be able to add claims for role', async function() {
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
            admin.assertEqual(all[0]);
        });
    });

    describe('#savePrincipalWithLimits', function() {
        it('should be able to save principal with roles', async function() {
            let realm  = `domain_${Math.random()}`;
            let dan = new Principal(realm, 'dan', {'age':31});
            dan.limits.add(new Limits('type', 'borrow', 100, 0));
            dan.limits.add(new Limits('type', 'spend', 10, 0));
            dan = await this.repositoryLocator.principalRepository.save(dan);

            let bob = new Principal(realm, 'bob', {'age':21});
            bob.limits.add(new Limits('kind', 'borrow', 100, 0));
            bob.limits.add(new Limits('kind', 'spend', 10, 0));
            bob = await this.repositoryLocator.principalRepository.save(bob);

            let loadedDan = await this.repositoryLocator.principalRepository.findByPrincipalName(realm, dan.principalName);
            assert.ok(loadedDan); 
            loadedDan.assertEqual(dan);

            let loadedBob = await this.repositoryLocator.principalRepository.findByPrincipalName(realm, bob.principalName);
            assert.ok(loadedBob); 
            loadedBob.assertEqual(bob);
        });
    });

    describe('#savePrincipalWithRoles', function() {
        it('should be able to save principal with roles', async function() {
            let realm  = `domain_${Math.random()}`;
            let employee = new Role(realm, 'Employee', {'age':33});
            await this.repositoryLocator.roleRepository.save(employee);
            //
            let manager = new Role(realm, 'Manager', {'age':23});
            manager.parents.add(employee);
            await this.repositoryLocator.roleRepository.save(manager);
            //
            let admin = new Role(realm, 'Admin');
            admin.parents.add(manager);
            await this.repositoryLocator.roleRepository.save(admin);

            let sales = new Role(realm, 'Sales');
            await this.repositoryLocator.roleRepository.save(sales);

            let dan = new Principal(realm, 'dan');
            dan.roles.add(admin);
            dan.roles.add(sales);
            dan = await this.repositoryLocator.principalRepository.save(dan);

            let bob = new Principal(realm, 'bob');
            bob.roles.add(manager);
            bob = await this.repositoryLocator.principalRepository.save(bob);

            let loadedDan = await this.repositoryLocator.principalRepository.findByPrincipalName(realm, dan.principalName);
            assert.ok(loadedDan); 
            loadedDan.assertEqual(dan);

            let loadedBob = await this.repositoryLocator.principalRepository.findByPrincipalName(realm, bob.principalName);
            assert.ok(loadedBob); 
            loadedBob.assertEqual(bob);
        });
    });


    describe('#savePrincipalWithClaims', function() {
        it('should be able to save principal with roles', async function() {
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

            let sales = new Role(realm, 'Sales');
            sales.claims.add(new Claim(realm, 'sell', 'computers'));
            await this.repositoryLocator.roleRepository.save(sales);

            let dan = new Principal(realm, 'dan');
            dan.limits.add(new Limits('type', 'borrow', 100, 0));
            dan.roles.add(admin);
            dan.roles.add(sales);
            dan.claims.add(new Claim(realm, 'buy', 'supplies'));
            dan.claims.add(new Claim(realm, 'order', 'food'));
            dan = await this.repositoryLocator.principalRepository.save(dan);

            let bob = new Principal(realm, 'bob');
            bob.limits.add(new Limits('kind', 'borrow', 100, 0));
            bob.roles.add(manager);
            bob.claims.add(new Claim(realm, 'attend', 'conference'));
            bob = await this.repositoryLocator.principalRepository.save(bob);

            let loadedDan = await this.repositoryLocator.principalRepository.findByPrincipalName(realm, dan.principalName);
            assert.ok(loadedDan); 
            assert.ok(loadedDan.assertEqual(dan)); 

            let loadedBob = await this.repositoryLocator.principalRepository.findByPrincipalName(realm, bob.principalName);
            assert.ok(loadedBob); 
            assert.ok(loadedBob.assertEqual(bob));
        });
    });

});
