/*@flow*/

import type {IConditionEvaluator}   from './interface';
const jexl = require('Jexl');

/**
 * Default implementation of ConditionEvaluator using morph-expressions
 * library.
 */
// https://github.com/TechnologyAdvice/Jexl
// https://github.com/abukurov/morph-expressions
export class ConditionEvaluator implements IConditionEvaluator {
	/**
	 * This method returns true if condition is true given context
	 *
	 * @param {*} condition - this can be an expression
	 * @param {*} context - this stores context with dynamic variables
	 * are used to evaluate the condition.
	 */
	async evaluate(condition: string, context: Map<string, any>): Promise<boolean> {
		const resp = await jexl.eval(condition, context);
		return resp != null && resp != undefined && resp != 0 && resp != false && resp != 'false';
	}
}
