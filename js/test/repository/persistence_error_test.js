const assert  = require('chai').assert;
const PersistenceError = require('../../src/repository/persistence_error');

describe('PersistenceError', function() {
    before(function(done) {
        done();
    });
    describe('#create', function() {
        it('should be able to create persistence-error', function() {
            Error.captureStackTrace = null;
            let error = new PersistenceError('msg');
            assert.ok(error.stack);
        });
    });
    describe('#stack', function() {
        it('should be able to override stack function', function() {
            Error.captureStackTrace = (e) => {
                return 'stack';
            };
            let error = new PersistenceError('msg');
            assert.ok(error.stack);
        });
    });
});
