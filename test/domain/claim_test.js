var assert = require('chai').assert;
import {ClaimImpl}      from '../../src/domain/claim';

describe('Claim', function() {
  describe('#hasCondition', function() {
    it('should return false when the condition is null', function() {
      let claim = new ClaimImpl();
      claim.condition = null;
      assert.notOk(claim.hasCondition());
    });
  });
  describe('#hasCondition', function() {
    it('should return false when the condition is undefined', function() {
      let claim = new ClaimImpl();
      claim.condition = undefined;
      assert.notOk(claim.hasCondition());
    });
  });
  describe('#hasCondition', function() {
    it('should return false when the condition has expression', function() {
      let claim = new ClaimImpl();
      claim.condition = "x = y";
      assert.ok(claim.hasCondition());
    });
  });
  describe('#implies', function() {
    it('should return false when the claim has different action', function() {
      let claim = new ClaimImpl(1, null, "read", "file", "");
      assert.notOk(claim.implies("write", "file"));
    });
  });
  describe('#implies', function() {
    it('should return true when the claim has same action/resource', function() {
      let claim = new ClaimImpl(1, null, "read", "file", "");
      assert.ok(claim.implies("read", "file"));
    });
  });
  describe('#implies', function() {
    it('should return true when the claim has same wildcard action', function() {
      let claim = new ClaimImpl(1, null, ".*", "database", "");
      assert.ok(claim.implies("read", "database"));
    });
  });
  describe('#implies', function() {
    it('should return true when the claim has same regex action', function() {
      let claim = new ClaimImpl(1, null, "(write|read|update|delete)", "database", "");
      assert.ok(claim.implies("read", "database"));
      assert.ok(claim.implies("write", "database"));
      assert.notOk(claim.implies("destroy", "database"));
    });
  });
});
