process.env.NODE_ENV = 'test';

const chai      = require('chai');
const chaiHttp  = require('chai-http');
const server    = require('./server');
const should    = chai.should();

chai.use(chaiHttp);

describe('SecurityService', function () {
    let realmId = 0;
    //
    let employeeId = 0;
    let tellerId = 0;
    let csrId = 0;
    let accountantId = 0;
    let accountantMgrId = 0;
    let loanOfficerId = 0;
    let branchManagerId = 0;
    //
    let tomId = 0;
    let cassyId = 0;
    let aliId = 0;
    let mikeId = 0;
    let larryId = 0;
    let barryId = 0;
    //
    describe('POST /realms', function () {
      it('Save realm', (done) => {
        chai.request(server)
          .post('/realms')
          .send(JSON.stringify({"realmName":"banking"}))
          .end((err, res) => {
              res.should.have.status(201);
              res.body.should.be.a('object');
              res.body.should.have.property('realmName').eql('banking');
              realmId = res.body.id;
              done();
          });
      });
    });

    describe('PUT /realms', function () {
      it('Update realm', (done) => {
        chai.request(server)
          .put(`/realms/${realmId}`)
          .send(JSON.stringify({"realmName":"banking"}))
          .end((err, res) => {
              res.should.have.status(405);
              done();
          });
      });
    });

    describe('GET /realms', function () {
      it('Get all realms', (done) => {
        chai.request(server)
          .get('/realms')
          .end((err, res) => {
              res.should.have.status(200);
              res.body.should.be.a('array');
              res.body.length.should.be.eql(1);
              res.body[0].should.have.property('realmName').eql('banking');
            done();
          });
      });
    });


    describe('GET /realms/realm-id', function () {
      it('Get realms by ID', (done) => {
        chai.request(server)
          .get(`/realms/${realmId}`)
          .end((err, res) => {
              res.should.have.status(200);
              res.body.should.be.a('object');
              res.body.should.have.property('realmName').eql('banking');
            done();
          });
      });
    });

    describe('POST /realms/realm-id/roles', function () {
      it('Save employee role', (done) => {
        chai.request(server)
          .post(`/realms/${realmId}/roles`)
          .send(JSON.stringify({"roleName":"Employee"}))
          .end((err, res) => {
              res.should.have.status(201);
              res.body.should.be.a('object');
              res.body.should.have.property('roleName').eql('Employee');
              employeeId = res.body.id;
              done();
          });
      });
    });

    describe('POST /realms/realm-id/roles', function () {
      it('Save Employee role', (done) => {
        chai.request(server)
          .post(`/realms/${realmId}/roles`)
          .send(JSON.stringify({"roleName":"Employee"}))
          .end((err, res) => {
              res.should.have.status(201);
              res.body.should.be.a('object');
              res.body.should.have.property('roleName').eql('Employee');
              employeeId = res.body.id;
              done();
          });
      });
    });

    describe('POST /realms/realm-id/roles', function () {
      it('Save Teller role', (done) => {
        chai.request(server)
          .post(`/realms/${realmId}/roles`)
          .send(JSON.stringify({"roleName":"Teller","claims":[{"action": "(read|modify)", "resource": "DepositAccount", "condition": "employeeRegion == 'MIDWEST'", "effect": "allow"}], "parents":[{"id": employeeId}]}))
          .end((err, res) => {
              res.should.have.status(201);
              res.body.should.be.a('object');
              res.body.should.have.property('roleName').eql('Teller');
              res.body.claims.should.be.a('array');
              res.body.claims.length.should.be.eql(1);
              res.body.claims[0].should.have.property('action').eql('(read|modify)');
              res.body.claims[0].should.have.property('resource').eql('DepositAccount');
              res.body.claims[0].should.have.property('condition').eql("employeeRegion == 'MIDWEST'");
              res.body.claims[0].should.have.property('effect').eql('allow');
              res.body.parents.should.be.a('array');
              res.body.parents.length.should.be.eql(1);
              res.body.parents[0].should.have.property('roleName').eql('Employee');
              tellerId = res.body.id;
              done();
          });
      });
    });

    describe('POST /realms/realm-id/roles', function () {
      it('Save CSR role', (done) => {
        chai.request(server)
          .post(`/realms/${realmId}/roles`)
          .send(JSON.stringify({"roleName":"CSR","claims":[{"action": "(create|delete)", "resource": "DepositAccount", "condition": "employeeRegion == 'MIDWEST'", "effect": "allow"}], "parents":[{"id": tellerId}]}))
          .end((err, res) => {
              res.should.have.status(201);
              res.body.should.be.a('object');
              res.body.should.have.property('roleName').eql('CSR');
              res.body.claims.should.be.a('array');
              res.body.claims.length.should.be.eql(1);
              res.body.claims[0].should.have.property('action').eql('(create|delete)');
              res.body.claims[0].should.have.property('resource').eql('DepositAccount');
              res.body.claims[0].should.have.property('condition').eql("employeeRegion == 'MIDWEST'");
              res.body.claims[0].should.have.property('effect').eql('allow');
              res.body.parents.should.be.a('array');
              res.body.parents.length.should.be.eql(1);
              res.body.parents[0].should.have.property('roleName').eql('Teller');
              csrId = res.body.id;
              done();
          });
      });
    });

    describe('POST /realms/realm-id/roles', function () {
      it('Save Accountant role', (done) => {
        chai.request(server)
          .post(`/realms/${realmId}/roles`)
          .send(JSON.stringify({"roleName":"Accountant","claims":[{"action": "(read|create)", "resource": "GeneralLedger", "condition": "transactionDateYear == currentYear", "effect": "allow"}], "parents":[{"id": employeeId}]}))
          .end((err, res) => {
              res.should.have.status(201);
              res.body.should.be.a('object');
              res.body.should.have.property('roleName').eql('Accountant');
              res.body.claims.should.be.a('array');
              res.body.claims.length.should.be.eql(1);
              res.body.claims[0].should.have.property('action').eql('(read|create)');
              res.body.claims[0].should.have.property('resource').eql('GeneralLedger');
              res.body.claims[0].should.have.property('condition').eql("transactionDateYear == currentYear");
              res.body.claims[0].should.have.property('effect').eql('allow');
              res.body.parents.should.be.a('array');
              res.body.parents.length.should.be.eql(1);
              res.body.parents[0].should.have.property('roleName').eql('Employee');
              accountantId = res.body.id;
              done();
          });
      });
    });

    describe('POST /realms/realm-id/roles', function () {
      it('Save AccountingManager role', (done) => {
        chai.request(server)
          .post(`/realms/${realmId}/roles`)
          .send(JSON.stringify({"roleName":"AccountingManager","claims":
          [{"action": "(create|delete)", "resource": "LoanAccount", "condition": "accountBalance < 10000", "effect": "allow"},
          {"action": "(read|modify)", "resource": "LoanAccount", "condition": "accountBalance < 10000"},
          {"action": "read", "resource": "GeneralLedgerPostingRules", "condition": "transactionDateYear == currentYear"}],
          "parents":[{"id": accountantId}]}))
          .end((err, res) => {
              res.should.have.status(201);
              res.body.should.be.a('object');
              res.body.should.have.property('roleName').eql('AccountingManager');
              res.body.claims.should.be.a('array');
              res.body.claims.length.should.be.eql(3);
              res.body.claims[0].should.have.property('action').eql('(create|delete)');
              res.body.claims[0].should.have.property('resource').eql('LoanAccount');
              res.body.claims[0].should.have.property('condition').eql("accountBalance < 10000");
              res.body.claims[0].should.have.property('effect').eql('allow');
              res.body.claims[1].should.have.property('action').eql('(read|modify)');
              res.body.claims[1].should.have.property('resource').eql('LoanAccount');
              res.body.claims[1].should.have.property('condition').eql("accountBalance < 10000");
              res.body.claims[1].should.have.property('effect').eql('allow');
              res.body.claims[2].should.have.property('action').eql('read');
              res.body.claims[2].should.have.property('resource').eql('GeneralLedgerPostingRules');
              res.body.claims[2].should.have.property('condition').eql("transactionDateYear == currentYear");
              res.body.claims[2].should.have.property('effect').eql('allow');
              res.body.parents.should.be.a('array');
              res.body.parents.length.should.be.eql(1);
              res.body.parents[0].should.have.property('roleName').eql('Accountant');
              accountantMgrId = res.body.id;
              done();
          });
      });
    });

    describe('POST /realms/realm-id/roles', function () {
      it('Save LoanOfficer role', (done) => {
        chai.request(server)
          .post(`/realms/${realmId}/roles`)
          .send(JSON.stringify({"roleName":"LoanOfficer","claims":
          [{"action": "(create|modify|delete)", "resource": "GeneralLedgerPostingRules", "condition": "transactionDateYear == currentYear"}],
          "parents":[{"id": accountantMgrId}]}))
          .end((err, res) => {
              res.should.have.status(201);
              res.body.should.be.a('object');
              res.body.should.have.property('roleName').eql('LoanOfficer');
              res.body.claims.should.be.a('array');
              res.body.claims.length.should.be.eql(1);
              res.body.claims[0].should.have.property('action').eql('(create|modify|delete)');
              res.body.claims[0].should.have.property('resource').eql('GeneralLedgerPostingRules');
              res.body.claims[0].should.have.property('condition').eql("transactionDateYear == currentYear");
              res.body.claims[0].should.have.property('effect').eql('allow');
              res.body.parents.should.be.a('array');
              res.body.parents.length.should.be.eql(1);
              res.body.parents[0].should.have.property('roleName').eql('AccountingManager');
              loanOfficerId = res.body.id;
              done();
          });
      });
    });

    describe('POST /realms/realm-id/roles', function () {
      it('Save BranchManager role', (done) => {
        chai.request(server)
          .post(`/realms/${realmId}/roles`)
          .send(JSON.stringify({"roleName":"BranchManager","claims":[],
          "parents":[{"id": accountantMgrId}, {"id": loanOfficerId}]}))
          .end((err, res) => {
              res.should.have.status(201);
              res.body.should.be.a('object');
              res.body.should.have.property('roleName').eql('BranchManager');
              res.body.claims.should.be.a('array');
              res.body.claims.length.should.be.eql(0);
              res.body.parents.should.be.a('array');
              res.body.parents.length.should.be.eql(2);
              res.body.parents[0].should.have.property('roleName').eql('AccountingManager');
              res.body.parents[1].should.have.property('roleName').eql('LoanOfficer');
              loanOfficerId = res.body.id;
              done();
          });
      });
    });

    describe('GET /realms/realm-id/claims', function () {
      it('Get all claims', (done) => {
        chai.request(server)
          .get(`/realms/${realmId}/claims`)
          .end((err, res) => {
              res.should.have.status(200);
              res.body.should.be.a('array');
              res.body.length.should.be.gt(6);
            done();
          });
      });
    });

    describe('POST /realms/realm-id/principals', function () {
      it('Save Tom the Teller user', (done) => {
        chai.request(server)
          .post(`/realms/${realmId}/principals`)
          .send(JSON.stringify({"principalName":"tom","roles":[{"roleName":"Teller"}]}))
          .end((err, res) => {
              //console.log(`>>>> ${JSON.stringify(res.body)}`);
              res.should.have.status(201);
              res.body.should.be.a('object');
              res.body.should.have.property('principalName').eql('tom');
              res.body.roles.should.be.a('array');
              res.body.roles.length.should.be.eql(1);
              res.body.roles[0].should.have.property('roleName').eql('Teller');
              tomId = res.body.id;
              done();
          });
      });
    });


    describe('POST /realms/realm-id/principals', function () {
      it('Save Cassy the CSR user', (done) => {
        chai.request(server)
          .post(`/realms/${realmId}/principals`)
          .send(JSON.stringify({"principalName":"cassy","roles":[{"roleName":"CSR"}]}))
          .end((err, res) => {
              res.should.have.status(201);
              res.body.should.be.a('object');
              res.body.should.have.property('principalName').eql('cassy');
              res.body.roles.should.be.a('array');
              res.body.roles.length.should.be.eql(1);
              res.body.roles[0].should.have.property('roleName').eql('CSR');
              cassyId = res.body.id;
              done();
          });
      });
    });

    describe('POST /realms/realm-id/principals', function () {
      it('Save Ali the Accountant user', (done) => {
        chai.request(server)
          .post(`/realms/${realmId}/principals`)
          .send(JSON.stringify({"principalName":"ali","roles":[{"roleName":"Accountant"}]}))
          .end((err, res) => {
              res.should.have.status(201);
              res.body.should.be.a('object');
              res.body.should.have.property('principalName').eql('ali');
              res.body.roles.should.be.a('array');
              res.body.roles.length.should.be.eql(1);
              res.body.roles[0].should.have.property('roleName').eql('Accountant');
              aliId = res.body.id;
              done();
          });
      });
    });


    describe('POST /realms/realm-id/principals', function () {
      it('Save Mike the Accountant user', (done) => {
        chai.request(server)
          .post(`/realms/${realmId}/principals`)
          .send(JSON.stringify({"principalName":"mike","roles":[{"roleName":"AccountingManager"}]}))
          .end((err, res) => {
              res.should.have.status(201);
              res.body.should.be.a('object');
              res.body.should.have.property('principalName').eql('mike');
              res.body.roles.should.be.a('array');
              res.body.roles.length.should.be.eql(1);
              res.body.roles[0].should.have.property('roleName').eql('AccountingManager');
              mikeId = res.body.id;
              done();
          });
      });
    });

    describe('POST /realms/realm-id/principals', function () {
      it('Save Larry the Loan-officer user', (done) => {
        chai.request(server)
          .post(`/realms/${realmId}/principals`)
          .send(JSON.stringify({"principalName":"larry","roles":[{"roleName":"LoanOfficer"}]}))
          .end((err, res) => {
              res.should.have.status(201);
              res.body.should.be.a('object');
              res.body.should.have.property('principalName').eql('larry');
              res.body.roles.should.be.a('array');
              res.body.roles.length.should.be.eql(1);
              res.body.roles[0].should.have.property('roleName').eql('LoanOfficer');
              larryId = res.body.id;
              done();
          });
      });
    });

    describe('POST /realms/realm-id/principals', function () {
      it('Save Barry the Branch-manager user', (done) => {
        chai.request(server)
          .post(`/realms/${realmId}/principals`)
          .send(JSON.stringify({"principalName":"barry","claims":
          [{"action": "(read|modify|create|delete)", "resource": "LoanAccount", "condition": ""},
          {"action": "(read|modify|create|delete)", "resource": "GeneralLedgerPostingRules", "condition": ""}
            ], "roles":[{"roleName":"BranchManager"}]}))
          .end((err, res) => {
              res.should.have.status(201);
              res.body.should.be.a('object');
              res.body.should.have.property('principalName').eql('barry');
              res.body.roles.should.be.a('array');
              res.body.roles.length.should.be.eql(1);
              res.body.roles[0].should.have.property('roleName').eql('BranchManager');
              res.body.claims.should.be.a('array');
              res.body.claims.length.should.be.eql(2);
              res.body.claims[0].should.have.property('action').eql('(read|modify|create|delete)');
              res.body.claims[0].should.have.property('resource').eql('LoanAccount');
              res.body.claims[0].should.have.property('condition').eql('');
              res.body.claims[1].should.have.property('action').eql('(read|modify|create|delete)');
              res.body.claims[1].should.have.property('resource').eql('GeneralLedgerPostingRules');
              res.body.claims[1].should.have.property('condition').eql('');
              barryId = res.body.id;
              done();
          });
      });
    });
    describe('GET /realms/realm-id/principals', function () {
      it('Tom should not be able to read DepositAccount without correct region', (done) => {
        chai.request(server)
          .get(`/realms/${realmId}/principals/${tomId}/authorization?action=read&resource=DepositAccount&employeeRegion=WEST"`)
          .end((err, res) => {
              res.should.have.status(403);
            done();
          });
      });
    });
    describe('GET /realms/realm-id/principals', function () {
      it('Tom should be able to read DepositAccount', (done) => {
          console.log(`/realms/${realmId}/principals/${tomId}/authorization?action=read&resource=DepositAccount&employeeRegion=MIDWEST"`)
        chai.request(server)
          .get(`/realms/${realmId}/principals/${tomId}/authorization?action=read&resource=DepositAccount&employeeRegion=MIDWEST"`)
          .end((err, res) => {
              res.should.have.status(200);
            done();
          });
      });
    });

});
