var assert = require('chai').assert;
import {ClaimImpl}      from '../../src/domain/claim';
import {RealmImpl}      from '../../src/domain/realm';
import {PrincipalImpl}  from '../../src/domain/principal';
import {RoleImpl}       from '../../src/domain/role';

describe('Principal', function() {
  let realm = new RealmImpl(null, 'domain');

  describe('#constructor', function() {
    it('without realm should fail', function() {
      try {
        let principal = new PrincipalImpl();
        assert.notOk('should have failed');
      } catch (e) {
      }
    });
  });

  describe('#constructor', function() {
    it('with realm should not fail', function() {
      let principal = new PrincipalImpl(null, realm, 'username');
      assert.equal('username', principal.principalName);
    });
  });

  describe('#allClaims', function() {
    it('should return allClaims owned by principal and roles', function() {
      let principal = new PrincipalImpl(null, realm, 'username');
      //
      principal.claims.add(new ClaimImpl(null, principal.realm, 'read', 'file', 'a = b'));
      principal.claims.add(new ClaimImpl(null, principal.realm, 'write', 'file', 'a = b'));
      for (let i = 0; i < 3; i++) {
          let role          = new RoleImpl(null, realm, `admin-role_${i}`);
          role.claims.add(new ClaimImpl(null, role.realm, 'read', 'url', 'a = b'));
          role.claims.add(new ClaimImpl(null, role.realm, 'write', 'url', 'a = b'));
          principal.roles.add(role);
      }
      let claims = principal.allClaims();
      assert.equal(8, claims.size);
    });
  });

});
