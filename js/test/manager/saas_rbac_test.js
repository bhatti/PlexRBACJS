var chai = require("chai");
var assert = chai.assert;
var expect = chai.expect;
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);

const Claim             = require("../../src/domain/claim");
const Limits            = require("../../src/domain/limits");
const Principal         = require("../../src/domain/principal");
const Role              = require("../../src/domain/role");
const AuthorizationError = require("../../src/domain/auth_error");
const RepositoryLocator = require("../../src/repository/repository_locator");
const SecurityAccessRequest = require("../../src/domain/security_access_request");
const SecurityManager   = require("../../src/manager/security_manager");



describe("SaasRbac", function() {
    before(async function() {
        let promiseCreateDB = new Promise((resolve, reject) => {
        this.repositoryLocator = new RepositoryLocator("localhost", 6379, () => {
                resolve();
            });
        })
        await promiseCreateDB;

        this.securityManager   = new SecurityManager(this.repositoryLocator);
        //
        this.realm             = `domain_${Math.random()}`;

        this.employee          = await this.repositoryLocator.roleRepository.save(Role.parse(
            {"realm": this.realm, roleName: "Employee", "claims":[
                {"realm": this.realm, "action": "(view|submit)", "resource": "AnalysisReport"},
                {"realm": this.realm, "action": "read", "resource": "User"},
                {"realm": this.realm, "action": "read", "resource": "UserRole"},
                {"realm": this.realm, "action": "read", "resource": "UserClaim"}]}));
        this.customer           = await this.repositoryLocator.roleRepository.save(Role.parse(
            {"realm": this.realm, roleName: "Customer", "claims":[ 
			{"realm": this.realm, "action": "view", "resource": "AnalysisReport", "condition": "reportOwner === owner || publicReport === true"},
        	{"realm": this.realm, "action": "submit", "resource": "AnalysisReport", "condition": "(reportOwner === owner || publicReport === true) && AnalysisReport_value < AnalysisReport_maxAllowed && AnalysisReport_expirationDate|newerThanCurrentIsoDate"},
        	{"realm": this.realm, "action": "submitIncr", "resource": "AnalysisReport", "condition": "(reportOwner === owner || publicReport === true) && 'AnalysisReport'|incr"},
            {"realm": this.realm, "action": "read", "resource": "OrgUser", "condition": "organization === targetOrg"}]}));
        this.adminCustomer = await this.repositoryLocator.roleRepository.save(Role.parse(
            {"realm": this.realm, "realm":this.realm, roleName: "AdminCustomer", "claims":[ 
			{"realm": this.realm, "action": "(create|update|delete)", "resource": "OrgUser", "condition": "organization === targetOrg"}],
            "parents":["Customer"]}));

        this.adminEmployee      = await this.repositoryLocator.roleRepository.save(Role.parse(
            {"realm":this.realm, roleName: "AdminEmployee", "claims":[
			    {"realm": this.realm, "action": "(read|create|update|delete)", "resource": "OrgUser"},
				{"realm": this.realm, "action": "(create|update|delete)", "resource": "User"},
                {"realm": this.realm, "action": "(create|update|delete)", "resource": "UserRole"},
                {"realm": this.realm, "action": "(create|update|delete)", "resource": "UserClaim"}],
                "parents":["Employee", "AdminCustomer"]}));
        this.super              = await this.repositoryLocator.roleRepository.save(Role.parse(
            {"realm":this.realm, "roleName": "Super", "claims":[
                {"realm": this.realm, "action": "*", "resource": "AnalysisReport"},
				{"realm": this.realm, "action": "*", "resource": "User"},
                {"realm": this.realm, "action": "*", "resource": "UserRole"},
                {"realm": this.realm, "action": "*", "resource": "UserClaim"}],
                "parents":["Employee", "AdminCustomer"]}));
    });

    after(function(done) {
      done();
    });

    describe("#check", function() {
        it("A user without roles/claims should not be able to access AnalysisReport", async function() {
            let kevin = await this.repositoryLocator.principalRepository.save(new Principal(this.realm, "kevin"));
            let request = new SecurityAccessRequest(this.realm,
                "kevin", "view", "AnalysisReport", { });
            let access = await this.securityManager.check(request)
            assert.equal(Claim.defaultDeny, access);
            request = new SecurityAccessRequest(this.realm,
                "kevin", "submit", "AnalysisReport", { });
            access = await this.securityManager.check(request)
            assert.equal(Claim.defaultDeny, access);
        });
    });

    describe("#check", function() {
        it("A user with Employee role should be able to view and submit AnalysisReport", async function() {
            let tom     = new Principal(this.realm, "tom");
            tom.roles.add(this.employee);
            await this.repositoryLocator.principalRepository.save(tom);
            //
            let request = new SecurityAccessRequest(this.realm,
                "tom", "view", "AnalysisReport", { });
            let access = await this.securityManager.check(request)
            assert.equal(Claim.allow, access);
            //
            request = new SecurityAccessRequest(this.realm,
                "tom", "submit", "AnalysisReport", { });
            access = await this.securityManager.check(request)
            assert.equal(Claim.allow, access);
        });
    });

    describe("#check", function() {
        it("A user with Customer role should not be able to view and submit AnalysisReport without orgs", async function() {
            let cassie     = new Principal(this.realm, "cassie");
            cassie.roles.add(this.customer);
            await this.repositoryLocator.principalRepository.save(cassie);
            //
            // Note, we haven't initialized owner so it should fail
            let request = new SecurityAccessRequest(this.realm,
                "cassie", "view", "AnalysisReport", { });
            let access = await this.securityManager.check(request)
            assert.equal(Claim.defaultDeny, access);
        });
    });

    describe("#check", function() {
        it("A user with Customer role should be able to view and submit AnalysisReport for their orgs", async function() {
            let fred     = new Principal(this.realm, "fred");
            fred.properties.owner = 'abc';
            fred.roles.add(this.customer);
            await this.repositoryLocator.principalRepository.save(fred);
            // If org doesn't match it should fail
            let request = new SecurityAccessRequest(this.realm,
                "fred", "view", "AnalysisReport", {"reportOwner": "def" });
            let access = await this.securityManager.check(request)
            assert.equal(Claim.defaultDeny, access);
            //
            request = new SecurityAccessRequest(this.realm,
                "fred", "view", "AnalysisReport", {"reportOwner": "abc" });
            access = await this.securityManager.check(request)
            assert.equal(Claim.allow, access);
            //
            request = new SecurityAccessRequest(this.realm,
                "fred", "view", "AnalysisReport", {"publicReport": true });
            access = await this.securityManager.check(request)
            assert.equal(Claim.allow, access);
        });
    });

    describe("#check", function() {
        it("A user with Customer role should be able to submit AnalysisReport with limits", async function() {
            let jay     = new Principal(this.realm, "jay");
            jay.properties.owner = 'abc';
            jay.limits.add(new Limits('type', 'AnalysisReport', 2, 0));
            jay.roles.add(this.customer);
            await this.repositoryLocator.principalRepository.save(jay);
            // If org doesn't match it should fail
            let request = new SecurityAccessRequest(this.realm,
                "jay", "submit", "AnalysisReport", {"reportOwner": "abc", "publicReport": false });
            assert.equal(Claim.allow, await this.securityManager.check(request));
            assert.ok(await this.repositoryLocator.principalRepository.increment(jay, 'type', 'AnalysisReport'));
            assert.equal(Claim.allow, await this.securityManager.check(request));
            assert.ok(await this.repositoryLocator.principalRepository.increment(jay, 'type', 'AnalysisReport'));
            assert.equal(Claim.defaultDeny, await this.securityManager.check(request));
            //
        });
    });

    describe("#check", function() {
        it("A user with Customer role should be able to submit and increment AnalysisReport with limits", async function() {
            let chris     = new Principal(this.realm, "chris");
            chris.properties.owner = 'abc';
            chris.limits.add(new Limits('type', 'AnalysisReport', 2, 0));
            chris.roles.add(this.customer);
            await this.repositoryLocator.principalRepository.save(chris);
            // If org doesn't match it should fail
            let request = new SecurityAccessRequest(this.realm,
                "chris", "submitIncr", "AnalysisReport", {"reportOwner": "abc", "publicReport": false });
            assert.equal(Claim.allow, await this.securityManager.check(request));
            assert.equal(Claim.allow, await this.securityManager.check(request));
            let loaded = await this.repositoryLocator.principalRepository.findByPrincipalName(this.realm, chris.principalName);
            assert.equal(2, loaded.limits[0].value);
            assert.equal(Claim.defaultDeny, await this.securityManager.check(request));
            //
        });
    });

    describe("#check", function() {
        it("A user with customer role should not be able to create org-uesrs", async function() {
            let larry     = new Principal(this.realm, "larry");
            larry.properties.organization = 'abc';
            larry.roles.add(this.customer);
            await this.repositoryLocator.principalRepository.save(larry);
            // If org doesn't match it should fail
            let request = new SecurityAccessRequest(this.realm,
                "larry", "read", "OrgUser", {"targetOrg": "abc"});
            assert.equal(Claim.allow, await this.securityManager.check(request));
            request = new SecurityAccessRequest(this.realm,
                "larry", "create", "OrgUser", {"targetOrg": "abc"});
            assert.equal(Claim.defaultDeny, await this.securityManager.check(request));
            //
        });
    });

    describe("#check", function() {
        it("A user with admin-customer role should not be able to create org-uesrs", async function() {
            let larry     = new Principal(this.realm, "larry");
            larry.properties.organization = 'abc';
            larry.roles.add(this.adminCustomer);
            await this.repositoryLocator.principalRepository.save(larry);
            // If org doesn't match it should fail
            let request = new SecurityAccessRequest(this.realm,
                "larry", "read", "OrgUser", {"targetOrg": "abc"});
            assert.equal(Claim.allow, await this.securityManager.check(request));
            request = new SecurityAccessRequest(this.realm,
                "larry", "create", "OrgUser", {"targetOrg": "def"});
            assert.equal(Claim.defaultDeny, await this.securityManager.check(request));
            request = new SecurityAccessRequest(this.realm,
                "larry", "create", "OrgUser", {"targetOrg": "abc"});
            assert.equal(Claim.allow, await this.securityManager.check(request));
            //
        });
    });

    describe("#check", function() {
        it("A user with AdminCustomer role should be able to submit AnalysisReport with limits", async function() {
            let scott     = new Principal(this.realm, "scott");
            scott.properties.owner = 'abc';
            scott.limits.add(new Limits('type', 'AnalysisReport', 2, 0));
            scott.roles.add(this.adminCustomer);
            await this.repositoryLocator.principalRepository.save(scott);
            let request = new SecurityAccessRequest(this.realm,
                "scott", "submit", "AnalysisReport", {"reportOwner": "abc", "publicReport": false });
            assert.equal(Claim.allow, await this.securityManager.check(request));
            assert.ok(await this.repositoryLocator.principalRepository.increment(scott, 'type', 'AnalysisReport'));
            assert.equal(Claim.allow, await this.securityManager.check(request));
            assert.ok(await this.repositoryLocator.principalRepository.increment(scott, 'type', 'AnalysisReport'));
            assert.equal(Claim.defaultDeny, await this.securityManager.check(request));
            //
        });
    });

    describe("#check", function() {
        it("A user with AdminEmployee role should be able to submit AnalysisReport", async function() {
            let jeff     = new Principal(this.realm, "jeff");
            jeff.limits.add(new Limits('type', 'AnalysisReport', 2, 0));
            jeff.roles.add(this.adminEmployee);
            await this.repositoryLocator.principalRepository.save(jeff);
            let request = new SecurityAccessRequest(this.realm,
                "jeff", "submit", "AnalysisReport", {"reportOwner": "abc", "publicReport": false });
            assert.equal(Claim.allow, await this.securityManager.check(request));
            assert.ok(await this.repositoryLocator.principalRepository.increment(jeff, 'type', 'AnalysisReport'));
            assert.equal(Claim.allow, await this.securityManager.check(request));
            assert.ok(await this.repositoryLocator.principalRepository.increment(jeff, 'type', 'AnalysisReport'));
            assert.equal(Claim.allow, await this.securityManager.check(request));
            //
        });
    });

    describe("#check", function() {
        it("A user with AdminEmployee role should be able to create User, UserRole and UserClaim", async function() {
            let jeff     = new Principal(this.realm, "jeff");
            jeff.roles.add(this.adminEmployee);
            await this.repositoryLocator.principalRepository.save(jeff);
            let request = new SecurityAccessRequest(this.realm, "jeff", "create", "User", {});
            assert.equal(Claim.allow, await this.securityManager.check(request));
            request = new SecurityAccessRequest(this.realm, "jeff", "create", "UserRole", {});
            assert.equal(Claim.allow, await this.securityManager.check(request));
            request = new SecurityAccessRequest(this.realm, "jeff", "create", "UserClaim", {});
            assert.equal(Claim.allow, await this.securityManager.check(request));
        });
    });


    describe("#check", function() {
        it("A user with Super role should be able to submit AnalysisReport", async function() {
            let alex     = new Principal(this.realm, "alex");
            alex.roles.add(this.super);
            await this.repositoryLocator.principalRepository.save(alex);
            let request = new SecurityAccessRequest(this.realm,
                "alex", "submit", "AnalysisReport", {"reportOwner": "abc", "publicReport": false });
            assert.equal(Claim.allow, await this.securityManager.check(request));
        });
    });

    describe("#check", function() {
        it("A user with AdminEmployee role should be able to create User, UserRole and UserClaim", async function() {
            let alex     = new Principal(this.realm, "alex");
            alex.roles.add(this.adminEmployee);
            await this.repositoryLocator.principalRepository.save(alex);
            let request = new SecurityAccessRequest(this.realm, "alex", "create", "User", {});
            assert.equal(Claim.allow, await this.securityManager.check(request));
            request = new SecurityAccessRequest(this.realm, "alex", "create", "UserRole", {});
            assert.equal(Claim.allow, await this.securityManager.check(request));
            request = new SecurityAccessRequest(this.realm, "alex", "create", "UserClaim", {});
            assert.equal(Claim.allow, await this.securityManager.check(request));
        });
    });
});

