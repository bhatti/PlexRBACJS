var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);

const AuditRecordRepository     = require('../../src/repository/audit_record_repository');
const RepositoryLocator         = require('../../src/repository/repository_locator');
const AuditRecord               = require('../../src/domain/audit_record');
const PersistenceError          = require('../../src/repository/persistence_error');

describe('AuditRecordRepository', function() {
    before(function(done) {
        this.repositoryLocator = new RepositoryLocator('localhost', 6379, done);
    });

    after(function(done) {
        this.repositoryLocator.close();
        done();
    });

    describe('#findByRange', function() {
        it('should fail with invalid range', async function() {
            try {
                let records = await this.repositoryLocator.auditRecordRepository.findByRange('realm', 'user', 11, 10);
                assert(false, 'should not return record');
            } catch(err) {
            }
        });
    });

    describe('#findByRange', function() {
        it('should not be able to find audit-record by id without saving', async function() {
            try {
                let records = await this.repositoryLocator.auditRecordRepository.findByRange('realm', 'user', 1, 10);
                assert(false, 'should not return record');
            } catch(err) {
            }
        });
    });

    describe('#saveFind', function() {
        it('should be able to find record by id after saving', async function() {
            let actions = ['create', 'delete', 'view', 'read', 'remove', 'manager'];
            let realm = `realm_${new Date().toISOString()}`;
            for (var i=0; i<actions.length; i++) {
                let record  = await this.repositoryLocator.auditRecordRepository.save(realm,
                    new AuditRecord(realm, 'matt', 'type', actions[i], `new-claim_${i}`));
                assert.equal(realm, record.realm);
                assert.equal('matt', record.principalName);
                assert.equal('type', record.type);
                assert.equal(actions[i], record.action);
                assert.equal(`new-claim_${i}`, record.resource);
                //
                record  = await this.repositoryLocator.auditRecordRepository.save(realm,
                    new AuditRecord(realm, 'barry', 'type', actions[i], `new-claim_${i}`));
                assert.equal(realm, record.realm);
                assert.equal('barry', record.principalName);
                assert.equal('type', record.type);
                assert.equal(actions[i], record.action);
                assert.equal(`new-claim_${i}`, record.resource);
            }
            let records = await this.repositoryLocator.auditRecordRepository.findByRange(realm, 'matt', 0, 10);
            assert.equal(actions.length, records.length);
            for (var i=0; i<actions.length; i++) {
                let record = records[i];
                assert.equal(realm, record.realm);
                assert.equal('matt', record.principalName);
                assert.equal('type', record.type);
            }
        });
    });

});
