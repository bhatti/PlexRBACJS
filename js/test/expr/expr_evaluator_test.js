const assert = require('chai').assert;
const ConditionEvaluator = require('../../src/expr/expr_evaluator');
const SecurityAccessRequest = require('../../src/domain/security_access_request');
const Principal         = require('../../src/domain/principal');
const Limits            = require("../../src/domain/limits");

describe('ConditionEvaluator', function() {
    describe('#evaluate', function() {
        it('should return true when expr matches', async function() { 
            let principal          = new Principal('realm', 'user');
            let evaluator = new ConditionEvaluator({}, 
                    new SecurityAccessRequest('realm', principal, 'action', 'resource',
                                              {'amount':100, 'dept': 'SALES', 'hours': 12}), principal);
            let result = await evaluator.evaluate(
                "amount <= 500 && dept == 'SALES' && hours >= 8 && hours <= 17");
            assert.ok(result);
        });
    });
    describe('#evaluate', function() {
        it('should return true when expr matches', async function() {
            let principal          = new Principal('realm', 'user');
            let evaluator = new ConditionEvaluator({}, 
                    new SecurityAccessRequest('realm', principal, 'action', 'resource',
                                              {'amount':501, 'dept': 'SALES', 'hours': 12}), principal);
            let result = await evaluator.evaluate(
                "amount <= 500 && dept == 'SALES' && hours >= 8 && hours <= 17");
            assert.notOk(result);
        });
    });
    describe('#evaluate', function() {
        it('should return true when or expr matches', async function() {
            let principal          = new Principal('realm', 'user');
            principal.properties   = {'amount':1500, 'approver': 'bhatti'};
            let evaluator = new ConditionEvaluator({}, 
                    new SecurityAccessRequest('realm', principal, 'action', 'resource'), principal);
            let result = await evaluator.evaluate( "amount < 1000 || approver == bhatti");
            assert.notOk(result);
        });
    });
    describe('#evaluate', function() {
        it('should not match date year', async function() {
            let principal          = new Principal('realm', 'user');
            principal.properties.year = 2015;
            let evaluator = new ConditionEvaluator({}, 
                    new SecurityAccessRequest('realm', principal, 'action', 'resource'), principal);
            let result = await evaluator.evaluate("year == 2017");
            assert.notOk(result);
        });
    });
    describe('#evaluate', function() {
        it('should match date year', async function() {
            let principal          = new Principal('realm', 'user');
            principal.properties.year = 2017;
            let evaluator = new ConditionEvaluator({}, 
                    new SecurityAccessRequest('realm', principal, 'action', 'resource'), principal);
            let result = await evaluator.evaluate("year == 2017");
            assert.ok(result);
        });
    });
    describe('#evaluate', function() {
        it('should match without context', async function() {
            let principal          = new Principal('realm', 'user');
            let evaluator = new ConditionEvaluator({}, 
                    new SecurityAccessRequest('realm', principal, 'action', 'resource'), principal);
            let result = await evaluator.evaluate("2017 == 2017");
            assert.ok(result);
        });
    });
    describe('#evaluate', function() {
        it('should fail for undefined properties', async function() {
            let principal          = new Principal('realm', 'user');
            let evaluator = new ConditionEvaluator({}, 
                    new SecurityAccessRequest('realm', principal, 'action', 'resource'), principal);
            let result = await evaluator.evaluate("otherOwner === owner");
            assert.notOk(result);
        });
    });
    describe('#evaluate', function() {
        it('should fail for unmatching properties', async function() {
            let principal          = new Principal('realm', 'user');
            principal.properties.owner = 'abc'
            let evaluator = new ConditionEvaluator({}, 
                    new SecurityAccessRequest('realm', principal, 'action', 'resource'), principal);
            let result = await evaluator.evaluate("otherOwner === owner");
            assert.notOk(result);
        });
    });
    describe('#evaluate', function() {
        it('should match for associated properties', async function() {
            let principal          = new Principal('realm', 'user');
            principal.properties.owner = 'abc'
            let evaluator = new ConditionEvaluator({}, 
                    new SecurityAccessRequest('realm', principal, 'action', 'resource', {'otherOwner':'abc'}), principal);
            let result = await evaluator.evaluate("otherOwner === owner");
            assert.ok(result);
        });
    });
    describe('#evaluate', function() {
        it('should match for matching report-owner', async function() {
            let principal          = new Principal('realm', 'user');
            principal.properties.owner = 'abc'
            let evaluator = new ConditionEvaluator({}, 
                    new SecurityAccessRequest('realm', principal, 'action', 'resource', {'reportOwner':'abc'}), principal);
            let result = await evaluator.evaluate("reportOwner === owner || publicReport === true");
            assert.ok(result);
        });
    });
    describe('#evaluate', function() {
        it('should match for public report', async function() {
            let principal          = new Principal('realm', 'user');
            let evaluator = new ConditionEvaluator({}, 
                    new SecurityAccessRequest('realm', principal, 'action', 'resource', {'publicReport':true}), principal);
            let result = await evaluator.evaluate("reportOwner === owner || publicReport === true");
            assert.ok(result);
        });
    });
    describe('#evaluate', function() {
        it('should match complex condition', async function() {
            let principal          = new Principal('realm', 'user');
            principal.properties.owner = 'abc';
            principal.limits.add(new Limits('type', 'AnalysisReport', 100, 0));
            let evaluator = new ConditionEvaluator({}, 
                    new SecurityAccessRequest('realm', principal, 'action', 'resource', 
                                              {'publicReport':false,
                                              'reportOwner': 'abc'}), principal);
            assert.ok(await evaluator.evaluate("(reportOwner === owner || publicReport === true)"));
            assert.ok(await evaluator.evaluate("AnalysisReport_value < AnalysisReport_maxAllowed"));
            assert.ok(await evaluator.evaluate("AnalysisReport_expirationDate|newerThanCurrentIsoDate"));
            assert.ok(await evaluator.evaluate("(reportOwner === owner || publicReport === true) && AnalysisReport_value < AnalysisReport_maxAllowed && AnalysisReport_expirationDate|newerThanCurrentIsoDate"));
        });
    });
    
});
