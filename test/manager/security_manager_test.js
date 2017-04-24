var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);

import {ConditionEvaluator}         from '../../src/expr/expr_evaluator';
import {RepositoryLocator}          from '../../src/repository/repository_locator';
import {QueryOptions}               from '../../src/repository/interface';
import {Claim}                      from '../../src/domain/claim';
import {Realm}                      from '../../src/domain/realm';
import {Role}                       from '../../src/domain/role';
import {Principal}                  from '../../src/domain/principal';
import {SecurityAccessRequest}      from '../../src/domain/security_access_request';
import {SecurityManager}            from '../../src/manager/security_manager';


describe('SecurityManager', function() {
    let repositoryLocator: RepositoryLocator;
    let securityManager: SecurityManager;

    let realm: Realm;
    let cdDeposit: Claim;
    let ruDeposit: Claim;
    let cdLoan: Claim;
    let ruLoan: Claim;
    let rdLedger: Claim;
    let rGlpr: Claim;
    let cmdGlpr: Claim;

    let employee: Role;
    let teller: Role;
    let csr: Role;
    let accountant: Role;
    let accountantMgr: Role;
    let loanOfficer: Role;
    let branchManager: Role;

    before(async function() {
        let conditionEvaluator = new ConditionEvaluator();
        let promiseCreateDB = new Promise((resolve, reject) => {
            this.repositoryLocator  = new RepositoryLocator('sqlite', ':memory:', () => {
                resolve();
            });
        })

        await promiseCreateDB;

        this.securityManager   = new SecurityManager(conditionEvaluator, this.repositoryLocator);
        //
        this.realm             = await this.repositoryLocator.realmRepository.save(
            new Realm('banking'));
        this.ruDeposit         = await this.repositoryLocator.claimRepository.save(
            new Claim(this.realm, '(read|modify)', 'DepositAccount', 'employeeRegion == "MIDWEST"'));
        this.cdDeposit         = await this.repositoryLocator.claimRepository.save(
            new Claim(this.realm, '(create|delete)', 'DepositAccount', 'employeeRegion == "MIDWEST"'));
        this.cdLoan            = await this.repositoryLocator.claimRepository.save(
            new Claim(this.realm, '(create|delete)', 'LoanAccount', 'accountBalance < 10000'));
        this.ruLoan            = await this.repositoryLocator.claimRepository.save(
            new Claim(this.realm, '(read|modify)', 'LoanAccount', 'accountBalance < 10000'));
        this.rdLedger          = await this.repositoryLocator.claimRepository.save(
            new Claim(this.realm, '(read|create)', 'GeneralLedger', 'transactionDateYear == currentYear'));
        this.rGlpr             = await this.repositoryLocator.claimRepository.save(
            new Claim(this.realm, 'read', 'GeneralLedgerPostingRules', 'transactionDateYear == currentYear'));
        this.cudGlpr           = await this.repositoryLocator.claimRepository.save(
            new Claim(this.realm, '(create|modify|delete)', 'GeneralLedgerPostingRules', 'transactionDateYear == currentYear'));

        this.employee          = new Role(this.realm, 'Employee');
        this.teller            = new Role(this.realm, 'Teller');
        this.teller.parents.add(this.employee);
        this.teller.claims.add(this.ruDeposit);
        await this.repositoryLocator.roleRepository.save(this.teller);

        this.csr               = new Role(this.realm, 'CSR');
        this.csr.claims.add(this.cdDeposit);
        this.csr.parents.add(this.teller);
        await this.repositoryLocator.roleRepository.save(this.csr);

        this.accountant        = new Role(this.realm, 'Accountant');
        this.accountant.claims.add(this.rdLedger);
        this.accountant.parents.add(this.employee);
        await this.repositoryLocator.roleRepository.save(this.accountant);

        this.accountantMgr     = new Role(this.realm, 'AccountingManager');
        this.accountantMgr.claims.add(this.ruLoan);
        this.accountantMgr.claims.add(this.cdLoan);
        this.accountantMgr.claims.add(this.rGlpr);
        this.accountantMgr .parents.add(this.accountant);
        await this.repositoryLocator.roleRepository.save(this.accountantMgr);

        this.loanOfficer       = new Role(this.realm, 'LoanOfficer');
        this.loanOfficer.claims.add(this.cudGlpr);
        this.loanOfficer.parents.add(this.accountantMgr);
        await this.repositoryLocator.roleRepository.save(this.loanOfficer);

        this.branchManager       = new Role(this.realm, 'BranchManager');
        this.branchManager.parents.add(this.accountantMgr);
        this.branchManager.parents.add(this.loanOfficer);
        return await this.repositoryLocator.roleRepository.save(this.branchManager);

    });

    after(function(done) {
      done();
    });

    describe('#check', function() {
        it('teller should not be able to read deposit account without region', async function() {
            let tom     = new Principal(this.realm, 'tom');
            tom.roles.add(this.teller);
            let saved = await this.repositoryLocator.principalRepository.save(tom);
            //
            let request = new SecurityAccessRequest(this.realm.realmName,
                'tom', 'read', 'DepositAccount', {
                    "employeeRegion": "EAST"
                });
            let access = await this.securityManager.check(request)
            assert.equal(Claim.defaultDeny, access);
        });
    });


    describe('#check', function() {
        it('teller should not be able to access loan account', async function() {
            let tom     = new Principal(this.realm, 'tom');
            tom.roles.add(this.teller);
            await this.repositoryLocator.principalRepository.save(tom);
            //
            let request = new SecurityAccessRequest(this.realm.realmName,
                'tom', 'read', 'LoanAccount', {
                    "employeeRegion": "EAST"
                });
            let access = await this.securityManager.check(request)
            assert.equal(Claim.defaultDeny, access);
        });
    });

    describe('#check', function() {
        it('teller should be able to read deposit account based on region', async function() {
            let tom     = new Principal(this.realm, 'tom');
            tom.roles.add(this.teller);
            await this.repositoryLocator.principalRepository.save(tom);
            //
            let request = new SecurityAccessRequest(this.realm.realmName,
                'tom', 'read', 'DepositAccount', {
                    "employeeRegion": "MIDWEST"
                });
            let access = await this.securityManager.check(request)
            assert.equal(Claim.allow, access);
        });
    });

    describe('#check', function() {
        it('teller should not be able to modify deposit account without', async function() {
            let tom     = new Principal(this.realm, 'tom');
            tom.roles.add(this.teller);
            await this.repositoryLocator.principalRepository.save(tom);
            //
            let request = new SecurityAccessRequest(this.realm.realmName,
                'tom', 'modify', 'DepositAccount', {
                    "employeeRegion": "EAST"
                });
            let access = await this.securityManager.check(request)
            assert.equal(Claim.defaultDeny, access);
        });
    });

    describe('#check', function() {
        it('teller should be able to modify deposit account based on region', async function() {
            let tom     = new Principal(this.realm, 'tom');
            tom.roles.add(this.teller);
            await this.repositoryLocator.principalRepository.save(tom);
            //
            let request = new SecurityAccessRequest(this.realm.realmName,
                'tom', 'modify', 'DepositAccount', {
                    "employeeRegion": "MIDWEST"
                });
            let access = await this.securityManager.check(request)
            assert.equal(Claim.allow, access);
        });
    });


    describe('#check', function() {
        it('CSR should not be able to create deposit account without region', async function() {
            let cassy     = new Principal(this.realm, 'cassy');
            cassy.roles.add(this.csr);
            await this.repositoryLocator.principalRepository.save(cassy);
            //
            let request = new SecurityAccessRequest(this.realm.realmName,
                'cassy', 'create', 'DepositAccount', {
                    "employeeRegion": "EAST"
                });
            let access = await this.securityManager.check(request)
            assert.equal(Claim.defaultDeny, access);
        });
    });

    describe('#check', function() {
        it('CSR should not be able to access loan account', async function() {
            let cassy     = new Principal(this.realm, 'cassy');
            cassy.roles.add(this.csr);
            await this.repositoryLocator.principalRepository.save(cassy);
            //
            let request = new SecurityAccessRequest(this.realm.realmName,
                'cassy', 'read', 'LoanAccount', {
                    "employeeRegion": "EAST"
                });
            let access = await this.securityManager.check(request)
            assert.equal(Claim.defaultDeny, access);
        });
    });

    describe('#check', function() {
        it('CSR should be able to read deposit account based on region', async function() {
            let cassy     = new Principal(this.realm, 'cassy');
            cassy.roles.add(this.csr);
            await this.repositoryLocator.principalRepository.save(cassy);
            //
            let request = new SecurityAccessRequest(this.realm.realmName,
                'cassy', 'read', 'DepositAccount', {
                    "employeeRegion": "MIDWEST"
                });
            let access = await this.securityManager.check(request)
            assert.equal(Claim.allow, access);
        });
    });

    describe('#check', function() {
        it('CSR should be able to create deposit account based on region', async function() {
            let cassy     = new Principal(this.realm, 'cassy');
            cassy.roles.add(this.csr);
            await this.repositoryLocator.principalRepository.save(cassy);
            //
            let request = new SecurityAccessRequest(this.realm.realmName,
                'cassy', 'create', 'DepositAccount', {
                    "employeeRegion": "MIDWEST"
                });
            let access = await this.securityManager.check(request)
            assert.equal(Claim.allow, access);
        });
    });

    describe('#check', function() {
        it('CSR should not be able to delete deposit account without', async function() {
            let cassy     = new Principal(this.realm, 'cassy');
            cassy.roles.add(this.csr);
            await this.repositoryLocator.principalRepository.save(cassy);
            //
            let request = new SecurityAccessRequest(this.realm.realmName,
                'cassy', 'delete', 'DepositAccount', {
                    "employeeRegion": "EAST"
                });
            let access = await this.securityManager.check(request)
            assert.equal(Claim.defaultDeny, access);
        });
    });

    describe('#check', function() {
        it('CSR should be able to delete deposit account based on region', async function() {
            let cassy     = new Principal(this.realm, 'cassy');
            cassy.roles.add(this.csr);
            await this.repositoryLocator.principalRepository.save(cassy);
            //
            let request = new SecurityAccessRequest(this.realm.realmName,
                'cassy', 'delete', 'DepositAccount', {
                    "employeeRegion": "MIDWEST"
                });
            let access = await this.securityManager.check(request)
            assert.equal(Claim.allow, access);
        });
    });



    describe('#check', function() {
        it('Accountant should not be able to read general ledger without year matching', async function() {
            let ali     = new Principal(this.realm, 'ali');
            ali.roles.add(this.accountant);
            await this.repositoryLocator.principalRepository.save(ali);
            //
            let request = new SecurityAccessRequest(this.realm.realmName,
                'ali', 'read', 'GeneralLedger', {
                    "transactionDateYear": 2015,
                    "currentYear": new Date().getFullYear()
                });
            let access = await this.securityManager.check(request)
            assert.equal(Claim.defaultDeny, access);
        });
    });

    describe('#check', function() {
        it('Accountant should be able to read general ledger with year matching', async function() {
            let ali     = new Principal(this.realm, 'ali');
            ali.roles.add(this.accountant);
            await this.repositoryLocator.principalRepository.save(ali);
            //
            let request = new SecurityAccessRequest(this.realm.realmName,
                'ali', 'read', 'GeneralLedger', {
                    "transactionDateYear": new Date().getFullYear(),
                    "currentYear": new Date().getFullYear()
                });
            let access = await this.securityManager.check(request)
            assert.equal(Claim.allow, access);
        });
    });

    describe('#check', function() {
        it('Accountant should be able to create general ledger with year matching', async function() {
            let ali     = new Principal(this.realm, 'ali');
            ali.roles.add(this.accountant);
            await this.repositoryLocator.principalRepository.save(ali);
            //
            let request = new SecurityAccessRequest(this.realm.realmName,
                'ali', 'create', 'GeneralLedger', {
                    "transactionDateYear": new Date().getFullYear(),
                    "currentYear": new Date().getFullYear()
                });
            let access = await this.securityManager.check(request)
            assert.equal(Claim.allow, access);
        });
    });

    describe('#check', function() {
        it('Accountant should not be able to read deposit account', async function() {
            let ali     = new Principal(this.realm, 'ali');
            ali.roles.add(this.accountant);
            await this.repositoryLocator.principalRepository.save(ali);
            //
            let request = new SecurityAccessRequest(this.realm.realmName,
                'ali', 'read', 'DepositAccount', {
                    "employeeRegion": "MIDWEST"
                });
            let access = await this.securityManager.check(request)
            assert.equal(Claim.defaultDeny, access);
        });
    });

    describe('#check', function() {
        it('AccountMgr should not be able to read loan account with higher balance', async function() {
            let mike     = new Principal(this.realm, 'mike');
            mike.roles.add(this.accountantMgr);
            await this.repositoryLocator.principalRepository.save(mike);
            //
            let request = new SecurityAccessRequest(this.realm.realmName,
                'mike', 'read', 'LoanAccount', {
                    "accountBalance": 10001
                });
            let access = await this.securityManager.check(request)
            assert.equal(Claim.defaultDeny, access);
        });
    });

    describe('#check', function() {
        it('AccountMgr should be able to read loan account within balance', async function() {
            let mike     = new Principal(this.realm, 'mike');
            mike.roles.add(this.accountantMgr);
            await this.repositoryLocator.principalRepository.save(mike);
            //
            let request = new SecurityAccessRequest(this.realm.realmName,
                'mike', 'read', 'LoanAccount', {
                    "accountBalance": 9999
                });
            let access = await this.securityManager.check(request)
            assert.equal(Claim.allow, access);
        });
    });


    describe('#check', function() {
        it('AccountMgr should be able to modify loan account within balance', async function() {
            let mike     = new Principal(this.realm, 'mike');
            mike.roles.add(this.accountantMgr);
            await this.repositoryLocator.principalRepository.save(mike);
            //
            let request = new SecurityAccessRequest(this.realm.realmName,
                'mike', 'modify', 'LoanAccount', {
                    "accountBalance": 9999
                });
            let access = await this.securityManager.check(request)
            assert.equal(Claim.allow, access);
        });
    });
    describe('#check', function() {
        it('AccountMgr should be able to create loan account within balance', async function() {
            let mike     = new Principal(this.realm, 'mike');
            mike.roles.add(this.accountantMgr);
            await this.repositoryLocator.principalRepository.save(mike);
            //
            let request = new SecurityAccessRequest(this.realm.realmName,
                'mike', 'create', 'LoanAccount', {
                    "accountBalance": 9999
                });
            let access = await this.securityManager.check(request)
            assert.equal(Claim.allow, access);
        });
    });
    describe('#check', function() {
        it('AccountMgr should be able to delete loan account within balance', async function() {
            let mike     = new Principal(this.realm, 'mike');
            mike.roles.add(this.accountantMgr);
            await this.repositoryLocator.principalRepository.save(mike);
            //
            let request = new SecurityAccessRequest(this.realm.realmName,
                'mike', 'delete', 'LoanAccount', {
                    "accountBalance": 9999
                });
            let access = await this.securityManager.check(request)
            assert.equal(Claim.allow, access);
        });
    });
    describe('#check', function() {
        it('AccountMgr should be able to read general ledger posting rules', async function() {
            let mike     = new Principal(this.realm, 'mike');
            mike.roles.add(this.accountantMgr);
            await this.repositoryLocator.principalRepository.save(mike);
            //
            let request = new SecurityAccessRequest(this.realm.realmName,
                'mike', 'read', 'GeneralLedgerPostingRules', {
                    "transactionDateYear": new Date().getFullYear(),
                    "currentYear": new Date().getFullYear()
                });
            let access = await this.securityManager.check(request)
            assert.equal(Claim.allow, access);
        });
    });

    describe('#check', function() {
        it('AccountMgr should not be able to create general ledger posting rules', async function() {
            let mike     = new Principal(this.realm, 'mike');
            mike.roles.add(this.accountantMgr);
            await this.repositoryLocator.principalRepository.save(mike);
            //
            let request = new SecurityAccessRequest(this.realm.realmName,
                'mike', 'create', 'GeneralLedgerPostingRules', {
                    "transactionDateYear": new Date().getFullYear(),
                    "currentYear": new Date().getFullYear()
                });
            let access = await this.securityManager.check(request)
            assert.equal(Claim.defaultDeny, access);
        });
    });

    describe('#check', function() {
        it('Loan-officer should be able to read loan account', async function() {
            let larry     = new Principal(this.realm, 'larry');
            larry.roles.add(this.loanOfficer);
            await this.repositoryLocator.principalRepository.save(larry);
            //
            let request = new SecurityAccessRequest(this.realm.realmName,
                'larry', 'read', 'LoanAccount', {
                    "accountBalance": 9000
                });
            let access = await this.securityManager.check(request)
            assert.equal(Claim.allow, access);
        });
    });

    describe('#check', function() {
        it('Loan-officer should be able to modify loan account', async function() {
            let larry     = new Principal(this.realm, 'larry');
            larry.roles.add(this.loanOfficer);
            await this.repositoryLocator.principalRepository.save(larry);
            //
            let request = new SecurityAccessRequest(this.realm.realmName,
                'larry', 'modify', 'LoanAccount', {
                    "accountBalance": 9000
                });
            let access = await this.securityManager.check(request)
            assert.equal(Claim.allow, access);
        });
    });

    describe('#check', function() {
        it('Loan-officer should be able to create loan account', async function() {
            let larry     = new Principal(this.realm, 'larry');
            larry.roles.add(this.loanOfficer);
            await this.repositoryLocator.principalRepository.save(larry);
            //
            let request = new SecurityAccessRequest(this.realm.realmName,
                'larry', 'create', 'LoanAccount', {
                    "accountBalance": 9000
                });
            let access = await this.securityManager.check(request)
            assert.equal(Claim.allow, access);
        });
    });
    describe('#check', function() {
        it('Loan-officer should be able to delete loan account within balance', async function() {
            let larry     = new Principal(this.realm, 'larry');
            larry.roles.add(this.loanOfficer);
            await this.repositoryLocator.principalRepository.save(larry);
            //
            let request = new SecurityAccessRequest(this.realm.realmName,
                'larry', 'delete', 'LoanAccount', {
                    "accountBalance": 9000
                });
            let access = await this.securityManager.check(request)
            assert.equal(Claim.allow, access);
        });
    });
    describe('#check', function() {
        it('Loan-officer should be able to read general ledger posting rules', async function() {
            let larry     = new Principal(this.realm, 'larry');
            larry.roles.add(this.loanOfficer);
            await this.repositoryLocator.principalRepository.save(larry);
            //
            let request = new SecurityAccessRequest(this.realm.realmName,
                'larry', 'read', 'GeneralLedgerPostingRules', {
                    "transactionDateYear": new Date().getFullYear(),
                    "currentYear": new Date().getFullYear()
                });
            let access = await this.securityManager.check(request)
            assert.equal(Claim.allow, access);
        });
    });
    describe('#check', function() {
        it('Loan-officer should be able to create general ledger posting rules', async function() {
            let larry     = new Principal(this.realm, 'larry');
            larry.roles.add(this.loanOfficer);
            await this.repositoryLocator.principalRepository.save(larry);
            //
            let request = new SecurityAccessRequest(this.realm.realmName,
                'larry', 'create', 'GeneralLedgerPostingRules', {
                    "transactionDateYear": new Date().getFullYear(),
                    "currentYear": new Date().getFullYear()
                });
            let access = await this.securityManager.check(request)
            assert.equal(Claim.allow, access);
        });
    });


    describe('#check', function() {
        it('Loan-officer should be able to modify general ledger posting rules', async function() {
            let larry     = new Principal(this.realm, 'larry');
            larry.roles.add(this.loanOfficer);
            await this.repositoryLocator.principalRepository.save(larry);
            //
            let request = new SecurityAccessRequest(this.realm.realmName,
                'larry', 'modify', 'GeneralLedgerPostingRules', {
                    "transactionDateYear": new Date().getFullYear(),
                    "currentYear": new Date().getFullYear()
                });
            let access = await this.securityManager.check(request)
            assert.equal(Claim.allow, access);
        });
    });


    describe('#check', function() {
        it('Loan-officer should be able to delete general ledger posting rules', async function() {
            let larry     = new Principal(this.realm, 'larry');
            larry.roles.add(this.loanOfficer);
            await this.repositoryLocator.principalRepository.save(larry);
            //
            let request = new SecurityAccessRequest(this.realm.realmName,
                'larry', 'delete', 'GeneralLedgerPostingRules', {
                    "transactionDateYear": new Date().getFullYear(),
                    "currentYear": new Date().getFullYear()
                });
            let access = await this.securityManager.check(request)
            assert.equal(Claim.allow, access);
        });
    });


    describe('#check', function() {
        it('Branch-manager should be able to read loan account with higher balance', async function() {
            let barry     = new Principal(this.realm, 'barry');
            // adding claims directly to override account balance limitations
            barry.claims.add(new Claim(this.realm, '(create|delete)', 'LoanAccount', ''));
            barry.claims.add(new Claim(this.realm, '(read|modify)', 'LoanAccount', ''));
            barry.roles.add(this.branchManager);
            await this.repositoryLocator.principalRepository.save(barry);
            //
            let request = new SecurityAccessRequest(this.realm.realmName,
                'barry', 'read', 'LoanAccount', {
                    "accountBalance": 10001
                });
            let access = await this.securityManager.check(request)
            assert.equal(Claim.allow, access);
        });
    });

    describe('#check', function() {
        it('Branch-manager should be able to modify loan account', async function() {
            let barry     = new Principal(this.realm, 'barry');
            // adding claims directly to override account balance limitations
            barry.claims.add(new Claim(this.realm, '(create|delete)', 'LoanAccount', ''));
            barry.claims.add(new Claim(this.realm, '(read|modify)', 'LoanAccount', ''));
            barry.roles.add(this.branchManager);
            await this.repositoryLocator.principalRepository.save(barry);
            //
            let request = new SecurityAccessRequest(this.realm.realmName,
                'barry', 'modify', 'LoanAccount', {
                    "accountBalance": 10001
                });
            let access = await this.securityManager.check(request)
            assert.equal(Claim.allow, access);
        });
    });

    describe('#check', function() {
        it('Branch-manager should be able to create loan account', async function() {
            let barry     = new Principal(this.realm, 'barry');
            // adding claims directly to override account balance limitations
            barry.claims.add(new Claim(this.realm, '(create|delete)', 'LoanAccount', ''));
            barry.claims.add(new Claim(this.realm, '(read|modify)', 'LoanAccount', ''));
            barry.roles.add(this.branchManager);
            await this.repositoryLocator.principalRepository.save(barry);
            //
            let request = new SecurityAccessRequest(this.realm.realmName,
                'barry', 'create', 'LoanAccount', {
                    "accountBalance": 10001
                });
            let access = await this.securityManager.check(request)
            assert.equal(Claim.allow, access);
        });
    });
    describe('#check', function() {
        it('Branch-manager should be able to delete loan account', async function() {
            let barry     = new Principal(this.realm, 'barry');
            // adding claims directly to override account balance limitations
            barry.claims.add(new Claim(this.realm, '(create|delete)', 'LoanAccount', ''));
            barry.claims.add(new Claim(this.realm, '(read|modify)', 'LoanAccount', ''));
            barry.roles.add(this.branchManager);
            await this.repositoryLocator.principalRepository.save(barry);
            //
            let request = new SecurityAccessRequest(this.realm.realmName,
                'barry', 'delete', 'LoanAccount', {
                    "accountBalance": 10001
                });
            let access = await this.securityManager.check(request)
            assert.equal(Claim.allow, access);
        });
    });
    describe('#check', function() {
        it('Branch-manager should be able to read general ledger posting rules', async function() {
            let barry     = new Principal(this.realm, 'barry');
            barry.roles.add(this.branchManager);
            // adding claims to override year limitation
            barry.claims.add(new Claim(this.realm, '(read|create|modify|delete)', 'GeneralLedgerPostingRules', ''));
            await this.repositoryLocator.principalRepository.save(barry);
            //
            let request = new SecurityAccessRequest(this.realm.realmName,
                'barry', 'read', 'GeneralLedgerPostingRules', { });
            let access = await this.securityManager.check(request)
            assert.equal(Claim.allow, access);
        });
    });
    describe('#check', function() {
        it('Branch-manager should be able to create general ledger posting rules', async function() {
            let barry     = new Principal(this.realm, 'barry');
            barry.roles.add(this.branchManager);
            // adding claims to override year limitation
            barry.claims.add(new Claim(this.realm, '(read|create|modify|delete)', 'GeneralLedgerPostingRules', ''));
            await this.repositoryLocator.principalRepository.save(barry);
            //
            let request = new SecurityAccessRequest(this.realm.realmName,
                'barry', 'create', 'GeneralLedgerPostingRules', { });
            let access = await this.securityManager.check(request)
            assert.equal(Claim.allow, access);
        });
    });


    describe('#check', function() {
        it('Branch-manager should be able to modify general ledger posting rules', async function() {
            let barry     = new Principal(this.realm, 'barry');
            barry.roles.add(this.branchManager);
            // adding claims to override year limitation
            barry.claims.add(new Claim(this.realm, '(read|create|modify|delete)', 'GeneralLedgerPostingRules', ''));
            await this.repositoryLocator.principalRepository.save(barry);
            //
            let request = new SecurityAccessRequest(this.realm.realmName,
                'barry', 'modify', 'GeneralLedgerPostingRules', { });
            let access = await this.securityManager.check(request)
            assert.equal(Claim.allow, access);
        });
    });


    describe('#check', function() {
        it('Branch-manager should be able to delete general ledger posting rules', async function() {
            let barry     = new Principal(this.realm, 'barry');
            barry.roles.add(this.branchManager);
            // adding claims to override year limitation
            barry.claims.add(new Claim(this.realm, '(read|create|modify|delete)', 'GeneralLedgerPostingRules', ''));
            await this.repositoryLocator.principalRepository.save(barry);
            //
            let request = new SecurityAccessRequest(this.realm.realmName,
                'barry', 'delete', 'GeneralLedgerPostingRules', { });
            let access = await this.securityManager.check(request)
            assert.equal(Claim.allow, access);
        });
    });

});
