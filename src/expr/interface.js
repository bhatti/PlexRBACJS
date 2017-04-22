
/* @flow Interface file */

/**
 * ConditionEvaluator evaluates dynamic condition based on context.
 */
export interface IConditionEvaluator {
    /**
     * This method returns true if condition is true given context
     * 
     * @param {*} condition - this can be an expression
     * @param {*} context - this stores context with dynamic variables 
     * are used to evaluate the condition.
     */
    evaluate(condition: string, context: Map<string, any>): Promise<boolean>;
}
