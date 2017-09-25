var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);

import type {IRealm}                from '../../src/domain/interface';
import type {iAuditRecord}          from '../../src/domain/interface';
import {RealmRepositorySqlite}      from '../../src/repository/sqlite/realm_repository';
import {AuditRecordRepositorySqlite}      from '../../src/repository/sqlite/audit_record_repository';
import {DBFactory}                  from '../../src/repository/sqlite/db_factory';
import {RepositoryLocator}          from '../../src/repository/repository_locator';
import {QueryOptions}               from '../../src/repository/interface';
import {Realm}                      from '../../src/domain/realm';
import {AuditRecord}                from '../../src/domain/audit_record';
import {PersistenceError}           from '../../src/repository/persistence_error';
import {DefaultSecurityCache}       from '../../src/cache/security_cache';

// yarn audit_repo
describe('AuditRecordRepository', function() {
    let repositoryLocator: RepositoryLocator;

    before(function(done) {
        this.repositoryLocator = new RepositoryLocator('sqlite', ':memory:', done);
    });

    after(function(done) {
        this.repositoryLocator.dbFactory.close();
        done();
    });

    describe('#getByIdWihoutSave', function() {
        it('should not be able to get audit-record by id without saving', async function() {
            try {
                let record = await this.repositoryLocator.auditRecordRepository.findById(1000);
                assert(false, 'should not return record');
            } catch(err) {
            }
        });
    });

    describe('#saveGetById', function() {
        it('should be able to get record by id after saving', async function() {
            let realm  = await this.repositoryLocator.realmRepository.save(new Realm(`random-domain_${Math.random()}`));
            let record  = await this.repositoryLocator.auditRecordRepository.save(new AuditRecord(realm, 'matt', 'admin', 'create', 'new-claim', new Date()));
            assert.equal('matt', record.principalName);
            assert.equal('admin', record.type);
            assert.equal('create', record.action);
            assert.equal('new-claim', record.resource);
            let loaded = await this.repositoryLocator.auditRecordRepository.findById(record.id);
            assert.equal('matt', loaded.principalName);
            assert.equal('admin', loaded.type);
            assert.equal('create', loaded.action);
            assert.equal('new-claim', loaded.resource);
        });
    });

});
