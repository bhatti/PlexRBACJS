var assert = require('chai').assert;
import {ConditionEvaluator}      from '../../src/expr/expr_evaluator';

describe('ConditionEvaluator', function() {
  describe('#evaluate', function() {
    it('should return true when expr matches', async function() {
      let evaluator = new ConditionEvaluator();
      let result = await evaluator.evaluate(
        "amount <= 500 && dept == 'SALES' && hours >= 8 && hours <= 17",
        {'amount':100, 'dept': 'SALES', 'hours': 12});
      assert.ok(result);
    });
  });
  describe('#evaluate', function() {
    it('should return true when expr matches', async function() {
      let evaluator = new ConditionEvaluator();
      let result = await evaluator.evaluate(
        "amount <= 500 && dept == 'SALES' && hours >= 8 && hours <= 17",
        {'amount':501, 'dept': 'SALES', 'hours': 12});
      assert.notOk(result);
    });
  });
  describe('#evaluate', function() {
    it('should return true when or expr matches', async function() {
      let evaluator = new ConditionEvaluator();
      let result = await evaluator.evaluate(
        "amount < 1000 || approver == bhatti",
        {'amount':1500, 'approver': 'bhatti'});
      assert.notOk(result);
    });
  });
  describe('#evaluate', function() {
    it('should not match date year', async function() {
      let evaluator = new ConditionEvaluator();
      let result = await evaluator.evaluate(
        "year == 2017",
        {'year':2015});
      assert.notOk(result);
    });
  });
  describe('#evaluate', function() {
    it('should match date year', async function() {
      let evaluator = new ConditionEvaluator();
      let result = await evaluator.evaluate(
        "year == 2017",
        {'year':2017});
      assert.ok(result);
    });
  });
});
