var assert = require('chai').assert;
import {ConditionEvaluatorImpl}      from '../../src/expr/expr_evaluator';

describe('ConditionEvaluator', function() {
  describe('#evaluate', function() {
    it('should return true when expr matches', function() {
      let evaluator = new ConditionEvaluatorImpl();
      assert.ok(evaluator.evaluate(
        "amount <= 500 && dept == 'SALES' && hours >= 8 && hours <= 17",
        {'amount':100, 'dept': 'SALES', 'hours': 12}));
    });
  });
  describe('#evaluate', function() {
    it('should return true when expr matches', function() {
      let evaluator = new ConditionEvaluatorImpl();
      assert.notOk(evaluator.evaluate(
        "amount <= 500 && dept == 'SALES' && hours >= 8 && hours <= 17",
        {'amount':501, 'dept': 'SALES', 'hours': 12}));
    });
  });
  describe('#evaluate', function() {
    it('should return true when or expr matches', function() {
      let evaluator = new ConditionEvaluatorImpl();
      assert.notOk(evaluator.evaluate(
        "amount < 1000 || approver == bhatti",
        {'amount':1500, 'approver': 'bhatti'}));
    });
  });
});
