const assert = require('chai').assert;
const Claim  = require('../../src/domain/claim');
const Role   = require('../../src/domain/role');

describe('Role', function() {
    before(function(done) {
        done();
    });
    describe('#constructor', function() {
        it('should fail without realm', function() {
            try {
                let role = new Role();
                assert.notOk('should have failed');
            } catch (e) {
            }
        });
    });

    describe('#constructor', function() {
        it('should create valid role object', function() {
            let role          = new Role('realm', 'admin');
            assert.equal('admin', role.roleName);
            assert.ok(role.startDateISO());
            assert.ok(role.endDateISO());
            assert.equal('realm_admin', role.uniqueKey());
        });
    });
    describe('#parse', function() {
        it('should parse role with claims', function() {
            let role = Role.parse({"realm": "realm", roleName: "Employee", "claims":[
                {"realm": "realm", "action": "(view|submit)", "resource": "analysis-report"},
                {"realm": "realm", "action": "read", "resource": "user"},
                {"realm": "realm", "action": "read", "resource": "user-role"},
                {"realm": "realm", "action": "read", "resource": "user-claim"}]});
            assert.equal('Employee', role.roleName);
            assert.ok(role.startDateISO());
            assert.ok(role.endDateISO());
            assert.equal('realm_Employee', role.uniqueKey());
            assert.equal(4, role.claims.length);
        });
    });
    describe('#parse', function() {
        it('should parse role without claims', function() {
            let role = Role.parse({"realm": "realm", roleName: "Employee"});
            assert.equal('Employee', role.roleName);
            assert.ok(role.startDateISO());
            assert.ok(role.endDateISO());
            assert.equal('realm_Employee', role.uniqueKey());
        });
    });

    describe('#allClaims', function() {
        it('should return allClaims role', function() {
            let employee = new Role('org', 'Employee');
            employee.claims.add(new Claim(employee.realm, 'read', 'url', `a = b`));
            let manager  = new Role('org', 'Manager');
            manager.parents.push(employee);
            manager.claims.add(new Claim(employee.realm, 'write', 'url', `a = b`));
            let admin    = new Role('org', 'Admin');
            admin.claims.add(new Claim(employee.realm, 'delete', 'url', `a = b`));
            admin.parents.push(manager);
            //
            let claims = admin.allClaims();
            assert.equal(3, claims.length, `incorrect number of claims ${claims}`);
        });
    });

    describe('#allClaims', function() {
        it('should return allClaims owned by role and remove duplicates', function() {
            let employee = new Role('org', 'Employee');
            employee.claims.add(new Claim(employee.realm, 'read', 'url', `a = b`));
            let manager  = new Role('org', 'Manager');
            manager.parents.push(employee);
            manager.claims.add(new Claim(employee.realm, 'write', 'url', `a = b`));
            manager.claims.add(new Claim(employee.realm, 'read', 'url', `a = b`));
            let admin    = new Role('org', 'Admin');
            admin.claims.add(new Claim(employee.realm, 'delete', 'url', `a = b`));
            admin.claims.add(new Claim(employee.realm, 'read', 'url', `a = b`));
            admin.parents.push(manager);
            //
            let claims = admin.allClaims();
            assert.equal(3, claims.length, `incorrect number of claims ${claims}`);
        });
    });
});
