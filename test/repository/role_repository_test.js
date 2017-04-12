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
import {PrincipalRepositorySqlite}  from '../../src/repository/sqlite/principal_repository';
import {DBHelper}                   from '../../src/repository/sqlite/db_helper';
import {QueryOptions}               from '../../src/repository/interface';
import {RoleImpl}                   from '../../src/domain/role';
import {RealmImpl}                  from '../../src/domain/realm';
import {PrincipalImpl}              from '../../src/domain/principal';
import {PersistenceError}           from '../../src/repository/persistence_error';
import {DefaultSecurityCache}       from '../../src/cache/security_cache';


describe('RoleRepository', function() {
  let dbHelper:         DBHelper;
  let roleRepository:   RoleRepositorySqlite;
  let realmRepository:  RealmRepositorySqlite;
  let claimRepository:  ClaimRepositorySqlite;
  let principalRepository:  PrincipalRepositorySqlite;

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
            return this.roleRepository.findByName(saved.realm.realmName, saved.roleName);
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
        this.roleRepository.findByName(null, 'unknown-role').
            then(role => {
            done(new Error(`should fail - ${JSON.stringify(role)}`));
        }).catch(err => {
            done();
        });
    });
  });

  describe('#addParentsToRole', function() {
    it('should be able to add roles as parents', function(done) {
        let parentNames = ['tech-support', 'senior-tech-support', 'receptionist'];
        let newRoleName = ['tech-manager'];
        let allRoles = [...parentNames, ...newRoleName];
        //
        this.realmRepository.save(new RealmImpl(null, 'parent-add-domain')).
        then(realm => {
            return Promise.all(allRoles.map(name => {
                return this.roleRepository.save(new RoleImpl(null, realm, name))
            }));
        }).then(saved => {
            let parents = new Set([saved[0], saved[1], saved[2]]);
            let role = saved[3];
            return this.roleRepository.addParentsToRole(role, parents).
            then(updated => {
                return this.roleRepository.findById(role.id);
            });
        }).then(role => {
            let parents = [];
            role.parents.forEach(p => {
                parents.push(p.roleName);
            });
            assert.equal('tech-manager', role.roleName);
            assert.equal(3, parents.length);
            assert.ok(parents.includes('receptionist'), `Could not find receptionist in ${parents}`);
            assert.ok(parents.includes('tech-support'), `Could not find tech-support in ${parents}`);
            assert.ok(parents.includes('senior-tech-support'), `Could not find senior-tech-support in ${parents}`);
            done();
        }).catch(err => {
            done(err);
        });
    });
  });


 describe('#removeParentsToRole', function() {
    it('should be able to remove roles as parents', function(done) {
        let parentNames = ['tech-support', 'senior-tech-support', 'receptionist'];
        let newRoleName = ['tech-manager'];
        let allRoles = [...parentNames, ...newRoleName];
        //
        this.realmRepository.save(new RealmImpl(null, 'remove-parent-add-domain')).
        then(realm => {
            return Promise.all(allRoles.map(name => {
                return this.roleRepository.save(new RoleImpl(null, realm, name))
            }));
        }).then(saved => {
            let parents = new Set([saved[0], saved[1], saved[2]]);
            let role = saved[3];
            return this.roleRepository.addParentsToRole(role, parents).
            then(updated => {
                return this.roleRepository.removeParentsFromRole(role, new Set([saved[0]]));
            }).then(updated => {
                return this.roleRepository.findById(role.id);
            });
        }).then(role => {
            let parents = [];
            role.parents.forEach(p => {
                parents.push(p.roleName);
            });
            assert.equal(2, parents.length, `Unexpected size in ${parents}`);
            assert.equal('tech-manager', role.roleName);
            assert.ok(parents.includes('receptionist'), `Could not find receptionist in ${parents}`);
            assert.ok(parents.includes('senior-tech-support'), `Could not find senior-tech-support in ${parents}`);
            done();
        }).catch(err => {
            done(err);
        });
    });
  });

  describe('#addRolesToPrincipal', function() {
    it('should be able to add roles to principal', function(done) {
        let rolesNames = ['tech-support', 'senior-tech-support', 'receptionist'];
        //
        this.realmRepository.save(new RealmImpl(null, `random-domain_${Math.random()}`)).
        then(realm => {
            return this.principalRepository.save(new PrincipalImpl(null, realm, 'johnd'));
        }).then(principal => {
            Promise.all(rolesNames.map(name => {
                return this.roleRepository.save(new RoleImpl(null, principal, name))
            })).then(saved => {
              let roles = new Set([saved[0], saved[1], saved[2]]);
              return this.roleRepository.addRolesToPrincipal(principal, roles);
            }).then(updated => {
                return this.principalRepository.findById(principal.id);
            }).then(principal => {
              let names = [];
              principal.roles.forEach(r => {
                  names.push(r.roleName);
              });
              assert.equal(3, names.length);
              assert.ok(names.includes('receptionist'), `Could not find receptionist in ${names}`);
              assert.ok(names.includes('tech-support'), `Could not find tech-support in ${names}`);
              assert.ok(names.includes('senior-tech-support'), `Could not find senior-tech-support in ${names}`);
              done();
            }).catch(err => {
              done(err);
            });
        }).catch(err => {
            done(err);
        });
    });
  });

  describe('#removeRolesFromPrincipal', function() {
    it('should be able to remove roles from principal', function(done) {
        let rolesNames = ['tech-support', 'senior-tech-support', 'receptionist'];
        //
        this.realmRepository.save(new RealmImpl(null, `random-domain_${Math.random()}`)).
        then(realm => {
            return this.principalRepository.save(new PrincipalImpl(null, realm, 'johnd'));
        }).then(principal => {
            Promise.all(rolesNames.map(name => {
                return this.roleRepository.save(new RoleImpl(null, principal, name))
            })).then(saved => {
              let roles = new Set([saved[0], saved[1], saved[2]]);
              return this.roleRepository.addRolesToPrincipal(principal, roles);
            }).then(updated => {
                return this.principalRepository.findById(principal.id);
            }).then(principal => {
                return this.roleRepository.removeRolesFromPrincipal(principal, principal.roles);
            }).then(updated => {
                return this.principalRepository.findById(principal.id);
            }).then(principal => {
              assert.equal(0, principal.roles.size);
              done();
            }).catch(err => {
              done(err);
            });
        }).catch(err => {
            done(err);
        });
    });
  });

  describe('#loadPrincipalRoles', function() {
    it('should be able to load roles for principal', function(done) {
        let rolesNames = ['tech-support', 'senior-tech-support', 'receptionist', 'manager'];
        //
        this.realmRepository.save(new RealmImpl(null, `random-domain_${Math.random()}`)).
        then(realm => {
            return this.principalRepository.save(new PrincipalImpl(null, realm, 'johnd'));
        }).then(principal => {
            Promise.all(rolesNames.map(name => {
                return this.roleRepository.save(new RoleImpl(null, principal, name))
            })).then(saved => {
              let roles = new Set([saved[0], saved[1], saved[2], saved[3]]);
              return this.roleRepository.addRolesToPrincipal(principal, roles);
            }).then(updated => {
                return this.roleRepository.loadPrincipalRoles(principal);
            }).then(updated => {
              assert.equal(4, principal.roles.size);
              done();
            }).catch(err => {
              done(err);
            });
        }).catch(err => {
            done(err);
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
