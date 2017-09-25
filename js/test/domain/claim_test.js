const assert = require('chai').assert;
const Claim  = require('../../src/domain/claim');

describe('Claim', function() {
    before(function(done) {
        done();
    });
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
            let claim = new Claim('realm', 'action', 'resource', '', new Date(0), new Date(0));
            claim.condition = null;
            assert.notOk(claim.hasCondition());
            assert.ok(claim.startDateISO());
            assert.ok(claim.endDateISO());
            assert.equal('realm', claim.realm);
        });
    });

    describe('#hasCondition', function() {
        it('should succeed with condition', function() {
            let claim = new Claim('realm', 'action', 'resource', 'x = y', new Date(0), new Date(0));
            assert.ok(claim.hasCondition());
            assert.equal('realm', claim.realm);
            assert.ok(claim.startDateISO());
            assert.ok(claim.endDateISO());
        });
    });

    describe('#implies', function() {
        it(' with different action should not match', function() {
            let claim = new Claim('realm', 'read', 'file', '');
            assert.notOk(claim.implies('write', 'file'));
        });
    });

    describe('#implies', function() {
        it('claim with same action/resource should match', function() {
            let claim = new Claim('realm', 'read', 'file', '');
            assert.ok(claim.implies('read', 'file'));
        });
    });

    describe('#implies', function() {
        it('claim with wildcard should match', function() {
            let claim = new Claim('realm', '.*', 'database', '');
            assert.ok(claim.implies('read', 'database'));
        });
    });

    describe('#implies', function() {
        it('claim with star should match', function() {
            let claim = new Claim('realm', '*', 'database', '');
            assert.ok(claim.implies('read', 'database'));
        });
    });

    describe('#implies', function() {
        it('claim with regex should match', function() {
            let claim = new Claim('realm', '(write|read|update|delete)', 'database', '');
            assert.ok(claim.implies('read', 'database'));
            assert.ok(claim.implies('write', 'database'));
            assert.notOk(claim.implies('destroy', 'database'));
        });
    });
});
