var assert = require('chai').assert;
import {Claim}      from '../../src/domain/claim';
import {Realm}      from '../../src/domain/realm';

describe('Claim', function() {
  let realm = new Realm('domain');

  describe('#constructor', function() {
	it('should fail without realm should fail', function() {
	  try {
		let claim = new Claim();
		assert.notOk('should have failed');
	  } catch (e) {
	  }
	});
  });

  describe('#constructor', function() {
	it('should not fail without condition', function() {
	  let claim = new Claim(realm, 'action', 'resource', '', new Date(0), new Date(0));
	  claim.condition = null;
	  assert.notOk(claim.hasCondition());
	  assert.ok(claim.startDate());
	  assert.ok(claim.endDate());
	  assert.ok(claim.realm() && claim.realm().realmName);
	});
  });

  describe('#hasCondition', function() {
	it('should succeed with condition', function() {
	  let claim = new Claim(realm, 'action', 'resource', 'x = y', new Date(0), new Date(0));
	  assert.ok(claim.hasCondition());
	  assert.ok(claim.realm());
	  assert.ok(claim.startDate());
	  assert.ok(claim.endDate());
	});
  });

  describe('#implies', function() {
	it(' with different action should not match', function() {
	  let claim = new Claim(realm, 'read', 'file', '');
	  assert.notOk(claim.implies('write', 'file'));
	});
  });

  describe('#implies', function() {
	it('claim with same action/resource should match', function() {
	  let claim = new Claim(realm, 'read', 'file', '');
	  assert.ok(claim.implies('read', 'file'));
	});
  });

  describe('#implies', function() {
	it('claim with wildcard should match', function() {
	  let claim = new Claim(realm, '.*', 'database', '');
	  assert.ok(claim.implies('read', 'database'));
	});
  });

  describe('#implies', function() {
	it('claim with regex should match', function() {
	  let claim = new Claim(realm, '(write|read|update|delete)', 'database', '');
	  assert.ok(claim.implies('read', 'database'));
	  assert.ok(claim.implies('write', 'database'));
	  assert.notOk(claim.implies('destroy', 'database'));
	});
  });
});
