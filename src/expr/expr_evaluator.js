/*@flow*/

import type {ConditionEvaluator}    from './interface';
import Parser                       from 'morph-expressions';

/**
 * Default implementation of ConditionEvaluator using morph-expressions 
 * library.
 */
// https://github.com/TechnologyAdvice/Jexl
// https://github.com/abukurov/morph-expressions
export class ConditionEvaluatorImpl implements ConditionEvaluator {
    parser: Parser;

    constructor() {
        this.parser = new Parser();

    }
    /**
     * This method returns true if condition is true given context
     * 
     * @param {*} condition - this can be an expression
     * @param {*} context - this stores context with dynamic variables 
     * are used to evaluate the condition.
     */
    evaluate(condition: string, context: Map<string, any>): boolean {
        const resp = this.parser.parseAndEval(condition, context)
        return resp != null && resp != undefined && resp != 0 && resp != false && resp != 'false';
    }
}