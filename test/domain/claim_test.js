var assert = require('chai').assert;
import {ClaimImpl}      from '../../src/domain/claim';
import {RealmImpl}      from '../../src/domain/realm';

describe('Claim', function() {
  let realm = new RealmImpl(null, 'domain');

  describe('#constructor', function() {
    it('without realm should fail', function() {
      try {
        let claim = new ClaimImpl();
        assert.notOk('should have failed');
      } catch (e) {
      }
    });
  });
  describe('#constructor', function() {
    it('without realm should fail', function() {
      let claim = new ClaimImpl(null, realm, 'action', 'resource', '');
      claim.condition = null;
      assert.notOk(claim.hasCondition());
    });
  });
  describe('#hasCondition', function() {
    it('should return false when the condition has expression', function() {
      let claim = new ClaimImpl(null, realm, 'action', 'resource', 'x = y');
      assert.ok(claim.hasCondition());
    });
  });
  describe('#implies', function() {
    it('should return false when the claim has different action', function() {
      let claim = new ClaimImpl(1, realm, 'read', 'file', '');
      assert.notOk(claim.implies('write', 'file'));
    });
  });
  describe('#implies', function() {
    it('should return true when the claim has same action/resource', function() {
      let claim = new ClaimImpl(1, realm, 'read', 'file', '');
      assert.ok(claim.implies('read', 'file'));
    });
  });
  describe('#implies', function() {
    it('should return true when the claim has same wildcard action', function() {
      let claim = new ClaimImpl(1, realm, '.*', 'database', '');
      assert.ok(claim.implies('read', 'database'));
    });
  });
  describe('#implies', function() {
    it('should return true when the claim has same regex action', function() {
      let claim = new ClaimImpl(1, realm, '(write|read|update|delete)', 'database', '');
      assert.ok(claim.implies('read', 'database'));
      assert.ok(claim.implies('write', 'database'));
      assert.notOk(claim.implies('destroy', 'database'));
    });
  });
});
