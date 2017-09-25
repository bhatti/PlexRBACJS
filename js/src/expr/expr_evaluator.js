const assert = require('assert');
const jexl      = require("Jexl");

/**
 * Default implementation of ConditionEvaluator using morph-expressions
 * library.
 */
// https://github.com/TechnologyAdvice/Jexl
// https://github.com/abukurov/morph-expressions
class ConditionEvaluator {
    constructor(repositoryLocator, request, principal) {
        assert(repositoryLocator, 'repository-locator not specified');
        assert(request, 'request not specified');
        assert(principal, 'principal not specified');
        this.context = {};
        this.context.isoDate = new Date().toISOString();
        Object.keys(request.context).forEach((key) => {
            this.context[key] = request.context[key];
        });
        Object.keys(principal.properties).forEach((key) => {
            this.context[key] = principal.properties[key];
        });
        for (var i=0; i<principal.limits.length; i++) {
            this.context[principal.limits[i].resource + "_value"] = principal.limits[i].value;
            this.context[principal.limits[i].resource + "_maxAllowed"] = principal.limits[i].maxAllowed; 
            this.context[principal.limits[i].resource + "_expirationDate"] = principal.limits[i].expirationDate.toISOString(); 
            // returns a promise for increment
			jexl.addTransform("incr", (key) => {
                let limit = principal.limits.filter(l => l.resource == key)[0];
                let resp = repositoryLocator.principalRepository.increment(principal, limit.type, limit.resource);
                return new Promise((resolve, reject) => {
                    resp.then(limits => resolve(true)).catch(e => reject(e));
                });
			});
			jexl.addTransform("olderThanCurrentIsoDate", (first) => {
                return first <= new Date().toISOString();
			});
			jexl.addTransform("newerThanCurrentIsoDate", (first) => {
                return first >= new Date().toISOString();
			});
        }
        //
        jexl.addBinaryOp('===', 100, (left, right) => {
            return left && right && left === right;
        });
    }


	/**
	 * This method returns true if condition is true given context
	 *
	 * @param {*} condition - this can be an expression
	 */
	async evaluate(condition) {
		const resp = await jexl.eval(condition, this.context);
		return resp != null && resp != 0 && resp != false && resp != "false";
	}
}
module.exports = ConditionEvaluator; 
