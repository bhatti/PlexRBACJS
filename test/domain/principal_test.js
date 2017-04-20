var assert = require('chai').assert;
import {Claim}      from '../../src/domain/claim';
import {Realm}      from '../../src/domain/realm';
import {Principal}  from '../../src/domain/principal';
import {Role}       from '../../src/domain/role';

describe('Principal', function() {
  let realm = new Realm('domain');

  describe('#constructor', function() {
    it('without realm should fail', function() {
      try {
        let principal = new Principal();
        assert.notOk('should have failed');
      } catch (e) {
      }
    });
  });

  describe('#constructor', function() {
    it('with realm should not fail', function() {
      let principal = new Principal(realm, 'username');
      assert.equal('username', principal.principalName);
    });
  });

  describe('#allClaims', function() {
    it('should return allClaims owned by principal and roles', function() {
      let principal = new Principal(realm, 'username');
      //
      principal.claims.add(new Claim(principal.realm, 'read', 'file', 'a = b'));
      principal.claims.add(new Claim(principal.realm, 'write', 'file', 'a = b'));
      for (let i = 0; i < 3; i++) {
          let role          = new Role(realm, `admin-role_${i}`);
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
      let principal = new Principal(realm, 'username');
      //
      principal.claims.add(new Claim(principal.realm, 'read', 'file', 'a = b'));
      principal.claims.add(new Claim(principal.realm, 'write', 'file', 'a = b'));
      for (let i = 0; i < 3; i++) {
          let role          = new Role(realm, `admin-role_${i}`);
          role.claims.add(new Claim(role.realm, 'read', 'url', 'a = b'));
          role.claims.add(new Claim(role.realm, 'write', 'url', 'a = b'));
          principal.roles.add(role);
      }
      let claims = principal.allClaims();
      assert.equal(4, claims.length, `incorrect number of claims ${claims}`);
    });
  });

});
