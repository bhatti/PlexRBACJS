process.env.NODE_ENV = 'test';

const chai      = require('chai');
const chaiHttp  = require('chai-http');
const server    = require('./server');
const should    = chai.should();

chai.use(chaiHttp);

/**
 * This test demonstrates claims that can be assigned to SAAS application
 * where customers can have different roles.
 */
describe('SaasRbacTest', function () {
    let realmId = 0;
    //
    let employeeId = 0;
    let adminEmployeeId = 0;
    let customerId = 0;
    let adminCustomerId;
    //
    let johnId = 0;  // employee
    let scottId = 0; // employee-admin
    let cassyId = 0; // customer
    let aliId = 0;   // customer-admin
    //

    describe('POST /realms', function () {
        it('Save realm', (done) => {
            chai.request(server)
            .post('/realms')
            .send(JSON.stringify({"realmName":"saas"}))
            .end((err, res) => {
                res.should.have.status(201);
                res.body.should.be.a('object');
                res.body.should.have.property('realmName').eql('saas');
                realmId = res.body.id;
                done();
            });
        });
    });

    // Test creating employee role
    describe('POST /realms/realm-id/roles', function () {
        it('Save employee role', (done) => {
            chai.request(server)
            .post(`/realms/${realmId}/roles`)
            .send(JSON.stringify({"roleName":"Employee","claims":[
                {"action": "(view|submit)", "resource": "analysis-report"},
                {"action": "read", "resource": "user"},
                {"action": "read", "resource": "user-role"},
                {"action": "read", "resource": "user-claim"}]}))
            .end((err, res) => {
                res.should.have.status(201);
                res.body.should.be.a('object');
                res.body.claims.should.be.a('array');
                res.body.claims.length.should.be.eql(4);
                res.body.claims[0].should.have.property('action').eql('(view|submit)');
                res.body.claims[0].should.have.property('resource').eql('analysis-report');
                res.body.claims[0].should.not.have.property('condition');
                res.body.claims[0].should.have.property('effect').eql('allow');

                res.body.claims[1].should.have.property('action').eql('read');
                res.body.claims[1].should.have.property('resource').eql('user');
                res.body.claims[1].should.not.have.property('condition');
                res.body.claims[1].should.have.property('effect').eql('allow');

                res.body.claims[2].should.have.property('action').eql('read');
                res.body.claims[2].should.have.property('resource').eql('user-role');
                res.body.claims[2].should.not.have.property('condition');
                res.body.claims[2].should.have.property('effect').eql('allow');

                res.body.claims[3].should.have.property('action').eql('read');
                res.body.claims[3].should.have.property('resource').eql('user-claim');
                res.body.claims[3].should.not.have.property('condition');
                res.body.claims[3].should.have.property('effect').eql('allow');

                res.body.parents.should.be.a('array');
                res.body.parents.length.should.be.eql(0);
                res.body.should.have.property('roleName').eql('Employee');
                employeeId = res.body.id;
                done();
            });
        });
    });

    describe('POST /realms/realm-id/roles', function () {
        it('Test creating AdminEmployee that extends Employee', (done) => {
            chai.request(server)
            .post(`/realms/${realmId}/roles`)
            .send(JSON.stringify({"roleName":"AdminEmployee","claims":[
                {"action": "(create|update|delete)", "resource": "user"},
                {"action": "(create|update|delete)", "resource": "user-role"},
                {"action": "(create|update|delete)", "resource": "user-claim"}],
                "parents":[{"id": employeeId}]}))
            .end((err, res) => {
                res.should.have.status(201);
                res.body.should.be.a('object');
                res.body.should.have.property('roleName').eql('AdminEmployee');
                res.body.claims.should.be.a('array');
                res.body.claims.length.should.be.eql(3);
                res.body.claims[0].should.have.property('action').eql('(create|update|delete)');
                res.body.claims[0].should.have.property('resource').eql('user');
                res.body.claims[0].should.not.have.property('condition');
                res.body.claims[0].should.have.property('effect').eql('allow');

                res.body.claims[1].should.have.property('action').eql('(create|update|delete)');
                res.body.claims[1].should.have.property('resource').eql('user-role');
                res.body.claims[1].should.not.have.property('condition');
                res.body.claims[1].should.have.property('effect').eql('allow');

                res.body.claims[2].should.have.property('action').eql('(create|update|delete)');
                res.body.claims[2].should.have.property('resource').eql('user-claim');
                res.body.claims[2].should.not.have.property('condition');
                res.body.claims[2].should.have.property('effect').eql('allow');
                res.body.parents.should.be.a('array');
                res.body.parents.length.should.be.eql(1);
                res.body.parents[0].should.have.property('roleName').eql('Employee');
                adminEmployeeId = res.body.id;
                done();
            });
        });
    });

    describe('POST /realms/realm-id/roles', function () {
        it('Test creating customer role', (done) => {
            chai.request(server)
            .post(`/realms/${realmId}/roles`)
            .send(JSON.stringify(
                {"roleName":"Customer","claims":[
                    {"action": "view", "resource": "analysis-report", "condition": "analysis-report.owner == loginUser.owner || analysis-report.public == true"},
                    {"action": "submit", "resource": "analysis-report", "condition": "(analysis-report.owner == loginUser.owner || analysis-report.public == true) && analysis-report.value < analysis-report.maxAllowed && analysis-report.expirationDate <= new Date()"},
                    {"action": "read", "resource": "org-user", "condition": "loginUser.organization == targetUser.organization"}]}))
            .end((err, res) => {
                res.should.have.status(201);
                res.body.should.be.a('object');
                res.body.should.have.property('roleName').eql('Customer');
                res.body.claims.should.be.a('array');
                res.body.claims.length.should.be.eql(3);
                res.body.claims[0].should.have.property('action').eql('view');
                res.body.claims[0].should.have.property('resource').eql('analysis-report');
                res.body.claims[0].should.have.property('condition').eql("analysis-report.owner == loginUser.owner || analysis-report.public == true");
                res.body.claims[0].should.have.property('effect').eql('allow');

                res.body.claims[1].should.have.property('action').eql('submit');
                res.body.claims[1].should.have.property('resource').eql('analysis-report');
                res.body.claims[1].should.have.property('condition').eql("(analysis-report.owner == loginUser.owner || analysis-report.public == true) && analysis-report.value < analysis-report.maxAllowed && analysis-report.expirationDate <= new Date()");
                res.body.claims[1].should.have.property('effect').eql('allow');

                res.body.claims[2].should.have.property('action').eql('read');
                res.body.claims[2].should.have.property('resource').eql('org-user');
                res.body.claims[2].should.have.property('condition').eql("loginUser.organization == targetUser.organization");
                res.body.claims[2].should.have.property('effect').eql('allow');

                res.body.parents.should.be.a('array');
                res.body.parents.length.should.be.eql(0);
                customerId = res.body.id;
                done();
            });
        });
    });

    describe('POST /realms/realm-id/roles', function () {
        it('Test creating customer-admin role', (done) => {
            chai.request(server)
            .post(`/realms/${realmId}/roles`)
            .send(JSON.stringify({"roleName":"AdminCustomer","claims":[
                {"action": "(create|update|delete)", "resource": "org-user", "condition": "loginUser.organization == targetUser.organization"}],
                "parents":[{"id": customerId}]}))
            .end((err, res) => {
                res.should.have.status(201);
                res.body.should.be.a('object');
                res.body.should.have.property('roleName').eql('AdminCustomer');
                res.body.claims.should.be.a('array');
                res.body.claims.length.should.be.eql(1);
                res.body.claims[0].should.have.property('action').eql('(create|update|delete)');
                res.body.claims[0].should.have.property('resource').eql('org-user');
                res.body.claims[0].should.have.property('condition').eql("loginUser.organization == targetUser.organization");
                res.body.claims[0].should.have.property('effect').eql('allow');
                res.body.parents.should.be.a('array');
                res.body.parents.length.should.be.eql(1);
                res.body.parents[0].should.have.property('roleName').eql('Customer');
                adminCustomerId = res.body.id;
                done();
            });
        });
    });

    describe('POST /realms/realm-id/principals', function () {
        it('Save John as Employee user', (done) => {
            chai.request(server)
            .post(`/realms/${realmId}/principals`)
            .send(JSON.stringify({"principalName":"john","roles":[{"roleName":"Employee"}]}))
            .end((err, res) => {
                //console.log(`>>>> ${JSON.stringify(res.body)}`);
                res.should.have.status(201);
                res.body.should.be.a('object');
                res.body.should.have.property('principalName').eql('john');
                res.body.roles.should.be.a('array');
                res.body.roles.length.should.be.eql(1);
                res.body.roles[0].should.have.property('roleName').eql('Employee');
                johnId = res.body.id;
                done();
            });
        });
    });

    describe('POST /realms/realm-id/principals', function () {
        it('Save scott as employee-admin', (done) => {
            chai.request(server)
            .post(`/realms/${realmId}/principals`)
            .send(JSON.stringify({"principalName":"scott","roles":[{"roleName":"AdminEmployee"}]}))
            .end((err, res) => {
                res.should.have.status(201);
                res.body.should.be.a('object');
                res.body.should.have.property('principalName').eql('scott');
                res.body.roles.should.be.a('array');
                res.body.roles.length.should.be.eql(1);
                res.body.roles[0].should.have.property('roleName').eql('AdminEmployee');
                scottId = res.body.id;
                done();
            });
        });
    });

    describe('POST /realms/realm-id/principals', function () {
        it('Save cassy as customer user', (done) => {
            chai.request(server)
            .post(`/realms/${realmId}/principals`)
            .send(JSON.stringify({"principalName":"cassy","roles":[{"roleName":"Customer"}]}))
            .end((err, res) => {
                res.should.have.status(201);
                res.body.should.be.a('object');
                res.body.should.have.property('principalName').eql('cassy');
                res.body.roles.should.be.a('array');
                res.body.roles.length.should.be.eql(1);
                res.body.roles[0].should.have.property('roleName').eql('Customer');
                cassyId = res.body.id;
                done();
            });
        });
    });

    describe('POST /realms/realm-id/principals', function () {
        it('Save ali as admin-customer user', (done) => {
            chai.request(server)
            .post(`/realms/${realmId}/principals`)
            .send(JSON.stringify({"principalName":"ali","roles":[{"roleName":"AdminCustomer"}]}))
            .end((err, res) => {
                res.should.have.status(201);
                res.body.should.be.a('object');
                res.body.should.have.property('principalName').eql('ali');
                res.body.roles.should.be.a('array');
                res.body.roles.length.should.be.eql(1);
                res.body.roles[0].should.have.property('roleName').eql('AdminCustomer');
                aliId = res.body.id;
                done();
            });
        });
    });


    describe('GET /realms/realm-id/principals/authorization', function () {
        it('John as Employee should not be able to create user', (done) => {
            chai.request(server)
            .get(`/realms/${realmId}/principals/${johnId}/authorization?action=create&resource=user`)
            .end((err, res) => {
                res.should.have.status(401);
                done();
            });
        });
    });

    describe('GET /realms/realm-id/principals/authorization', function () {
        it('John as Employee should not be able to delete user', (done) => {
            chai.request(server)
            .get(`/realms/${realmId}/principals/${johnId}/authorization?action=delete&resource=user`)
            .end((err, res) => {
                res.should.have.status(401);
                done();
            });
        });
    });

    describe('GET /realms/realm-id/principals/authorization', function () {
        it('John as Employee should be able to read user', (done) => {
            chai.request(server)
            .get(`/realms/${realmId}/principals/${johnId}/authorization?action=read&resource=user`)
            .end((err, res) => {
                res.should.have.status(200);
                done();
            });
        });
    });

    describe('GET /realms/realm-id/principals/authorization', function () {
        it('John as Employee should be able to view analysis-report', (done) => {
            chai.request(server)
            .get(`/realms/${realmId}/principals/${johnId}/authorization?action=view&resource=analysis-report`)
            .end((err, res) => {
                res.should.have.status(200);
                done();
            });
        });
    });

    describe('GET /realms/realm-id/principals/authorization', function () {
        it('John as Employee should be able to submit analysis-report', (done) => {
            chai.request(server)
            .get(`/realms/${realmId}/principals/${johnId}/authorization?action=submit&resource=analysis-report`)
            .end((err, res) => {
                res.should.have.status(200);
                done();
            });
        });
    });

    describe('GET /realms/realm-id/principals/authorization', function () {
        it('John as Employee should be able to read user-claim', (done) => {
            chai.request(server)
            .get(`/realms/${realmId}/principals/${johnId}/authorization?action=read&resource=user-claim`)
            .end((err, res) => {
                res.should.have.status(200);
                done();
            });
        });
    });


    describe('GET /realms/realm-id/principals/authorization', function () {
        it('Scott as AdminEmployee should not be able to delete user', (done) => {
            chai.request(server)
            .get(`/realms/${realmId}/principals/${johnId}/authorization?action=delete&resource=user`)
            .end((err, res) => {
                res.should.have.status(401);
                done();
            });
        });
    });

    describe('GET /realms/realm-id/principals/authorization', function () {
        it('Scott as AdminEmployee should be able to read user', (done) => {
            chai.request(server)
            .get(`/realms/${realmId}/principals/${scottId}/authorization?action=read&resource=user`)
            .end((err, res) => {
                res.should.have.status(200);
                done();
            });
        });
    });

    describe('GET /realms/realm-id/principals/authorization', function () {
        it('Scott as AdminEmployee should be able to update user-role', (done) => {
            chai.request(server)
            .get(`/realms/${realmId}/principals/${scottId}/authorization?action=update&resource=user-role`)
            .end((err, res) => {
                res.should.have.status(200);
                done();
            });
        });
    });

    describe('GET /realms/realm-id/principals/authorization', function () {
        it('Scott as AdminEmployee should be able to delete user-claim', (done) => {
            chai.request(server)
            .get(`/realms/${realmId}/principals/${scottId}/authorization?action=delete&resource=user-claim`)
            .end((err, res) => {
                res.should.have.status(200);
                done();
            });
        });
    });

    describe('GET /realms/realm-id/principals/authorization', function () {
        it('Scott as AdminEmployee should be able to view analysis-report', (done) => {
            chai.request(server)
            .get(`/realms/${realmId}/principals/${scottId}/authorization?action=view&resource=analysis-report`)
            .end((err, res) => {
                res.should.have.status(200);
                done();
            });
        });
    });

/*
    {"action": "view", "resource": "analysis-report", "condition": "analysis-report.owner == loginUser.owner || analysis-report.public == true"},
    {"action": "submit", "resource": "analysis-report", "condition": "(analysis-report.owner == loginUser.owner || analysis-report.public == true) && analysis-report.value < analysis-report.maxAllowed && analysis-report.expirationDate <= new Date()"},
    {"action": "read", "resource": "org-user", "condition": "loginUser.organization == targetUser.organization"}]}))
*/
    describe('GET /realms/realm-id/principals/authorization', function () {
        it('Scott as AdminEmployee should be able to submit analysis-report', (done) => {
            chai.request(server)
            .get(`/realms/${realmId}/principals/${scottId}/authorization?action=submit&resource=analysis-report`)
            .end((err, res) => {
                res.should.have.status(200);
                done();
            });
        });
    });

    describe('GET /realms/realm-id/principals/authorization', function () {
        it('Cassy as Customer should not be able to view private report', (done) => {
            chai.request(server)
            .get(`/realms/${realmId}/principals/${cassyId}/authorization?action=view&resource=analysis-report`)
            .end((err, res) => {
                res.should.have.status(401);
                done();
            });
        });
    });

    describe('GET /realms/realm-id/principals/authorization', function () {
        it('Cassy as Customer should be able to view public report', (done) => {
            chai.request(server)
            .get(`/realms/${realmId}/principals/${cassyId}/authorization?action=view&resource=analysis-report`)
            .end((err, res) => {
                res.should.have.status(401);
                done();
            });
        });
    });

});
