/* @flow Interface file */
const fs = require('fs');

import {DBFactory}                  from './sqlite/db_factory';
import type {RealmRepository}       from './interface';
import type {ClaimRepository}       from './interface';
import type {PrincipalRepository}   from './interface';
import type {RoleRepository}        from './interface';
import type {AuditRecordRepository} from './interface';
import type {LimitRepository}  from './interface';
//
import {RealmRepositorySqlite}      from './sqlite/realm_repository';
import {ClaimRepositorySqlite}      from './sqlite/claim_repository';
import {PrincipalRepositorySqlite}  from './sqlite/principal_repository';
import {RoleRepositorySqlite}       from './sqlite/role_repository';
import {AuditRecordRepositorySqlite} from './sqlite/audit_record_repository';
import {LimitRepositorySqlite} from './sqlite/limit_repository';
import {DefaultSecurityCache}       from '../cache/security_cache';

/**
 * RepositoryLocator provides access repositories
*/
export class RepositoryLocator {
    dbFactory:            DBFactory;
    claimRepository:      ClaimRepository;
    realmRepository:      RealmRepository;
    principalRepository:  PrincipalRepository;
    roleRepository:       RoleRepository;
    auditRecordRepository:       AuditRecordRepository;
    limitRepository:       LimitRepository;

    constructor(kind: string, dbPath: string, done: () => void) {
        this.dbFactory = new DBFactory(dbPath);
        this.dbFactory.db.on('trace', function(trace){
            //console.log(`trace ${trace}`);
        })
        //
        this.realmRepository     = new RealmRepositorySqlite(this.dbFactory, new DefaultSecurityCache());
        this.claimRepository     = new ClaimRepositorySqlite(this.dbFactory, this.realmRepository);
        this.auditRecordRepository     = new AuditRecordRepositorySqlite(this.dbFactory, this.realmRepository);
        this.limitRepository     = new LimitRepositorySqlite(this.dbFactory, this.realmRepository);
        this.roleRepository      = new RoleRepositorySqlite(this.dbFactory, this.realmRepository, this.claimRepository, new DefaultSecurityCache());
        this.principalRepository = new PrincipalRepositorySqlite(this.dbFactory, this.realmRepository, this.roleRepository, this.claimRepository, this.limitRepository, new DefaultSecurityCache());
        //
        if (fs.existsSync(dbPath) && fs.statSync(dbPath).size > 0) {
            done();
        } else {
            this.dbFactory.createTables(() => {
                done();
            });
        }
    }
}
