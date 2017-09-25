const assert  = require('chai').assert;
const Limits  = require('../../src/domain/limits');

describe('Limits', function() {
    before(function(done) {
        done();
    });
    describe('#constructor', function() {
        it('should fail without required params', function() {
            try {
                let limits = new Limits();
                assert.notOk('should have failed');
            } catch (e) {
            }
        });
    });

    describe('#uniqueKey', function() {
        it('should return unique key', function() {
            let limits = Limits.parse({'type':'type', 'resource': 'resource', 'maxAllowed': 100, 'value':1});
            assert.equal('type_resource', limits.uniqueKey());
            assert.equal('type_resource', limits.toString());
        });
    });

    describe('#valid', function() {
        it('should check for usage and expiration when validating', function() {
            let limits = new Limits('type', 'resource', 100, 1, new Date(0));
            assert.notOk(limits.valid());
            limits.expirationDate = new Date();
            assert.ok(limits.valid());
            limits.value = 101;
            assert.notOk(limits.valid());
        });
    });
});
