const assert = require('chai').assert;
const Claim  = require('../../src/domain/claim');
const Role   = require('../../src/domain/role');
const Limits = require('../../src/domain/limits');
const Principal   = require('../../src/domain/principal');

describe('Principal', function() {
    before(function(done) {
        done();
    });
    describe('#constructor', function() {
        it('should fail without realm', function() {
            try {
                let principal = new Principal();
                assert.notOk('should have failed');
            } catch (e) {
            }
        });
    });

    describe('#constructor', function() {
        it('should create default object', function() {
            let principal = new Principal('realm', 'username');
            assert.equal('username', principal.principalName);
            assert.equal('realm_username', principal.uniqueKey());
            assert.equal('realm_username', principal.toString());
        });
    }); 

    describe('#assertEqual', function() {
        it('should compare two instance of principal objects', function() {
            let principal1 = new Principal('realm', 'username');
            principal1.claims.add(new Claim('realm', 'read', 'book'));
            principal1.roles.add(new Role('realm', 'reader'));
            principal1.roles[0].claims.add(new Claim('realm', 'borrow', 'book'));
            principal1.limits.add(new Limits('type', 'books', 100, 10));
            principal1.properties.age = 21;
            //
            let principal2 = new Principal('realm', 'username');
            principal2.claims.add(new Claim('realm', 'read', 'book'));
            principal2.roles.add(new Role('realm', 'reader'));
            principal2.roles[0].claims.add(new Claim('realm', 'borrow', 'book'));
            principal2.limits.add(new Limits('type', 'books', 100, 10));
            principal2.properties.age = 21;
            //
            principal1.assertEqual(principal2);
        });
    });

    describe('#allClaims', function() {
        it('should return allClaims owned by principal and roles', function() {
            let principal = new Principal('realm', 'username');
            //
            principal.claims.add(new Claim(principal.realm, 'read', 'file', 'a = b'));
            principal.claims.add(new Claim(principal.realm, 'write', 'file', 'a = b'));
            for (let i = 0; i < 3; i++) {
                let role          = new Role(principal.realm, `admin-role_${i}`);
                role.claims.add(new Claim(role.realm, 'read', 'url', `a = b_${i}`));
                role.claims.add(new Claim(role.realm, 'write', 'url', `a = b_${i}`));
                principal.roles.add(role);
            }
            let claims = principal.allClaims();
            assert.equal(8, claims.length, `incorrect number of claims ${claims}`);
        });
    });

    describe('#allClaims', function() {
        it('should return allClaims owned by principal and roles and remove duplicates', function() {
            let principal = new Principal('realm', 'username');
            //
            principal.claims.add(new Claim(principal.realm, 'read', 'file', 'a = b'));
            principal.claims.add(new Claim(principal.realm, 'write', 'file', 'a = b'));
            for (let i = 0; i < 3; i++) {
                let role          = new Role(principal.realm, `admin-role_${i}`);
                role.claims.add(new Claim(role.realm, 'read', 'url', 'a = b'));
                role.claims.add(new Claim(role.realm, 'write', 'url', 'a = b'));
                principal.roles.add(role);
            }
            let claims = principal.allClaims();
            assert.equal(4, claims.length, `incorrect number of claims ${claims}`);
        });
    });

});
