require("babel-core/register");
require("babel-polyfill");

import {RepositoryLocator}          from '../../lib/repository/repository_locator';
import {SecurityManager}            from '../../lib/manager/security_manager';
import {ConditionEvaluator}         from '../../lib/expr/expr_evaluator';

const restify                   = require('restify');
global.server                   = restify.createServer();

global.server.use(restify.jsonBodyParser({ mapParams: true }));
global.server.use(restify.acceptParser(server.acceptable));
global.server.use(restify.queryParser({ mapParams: true }));
global.server.use(restify.fullResponse());

//
//global.server.repositoryLocator = new RepositoryLocator('sqlite', ':memory:', () => {});
global.server.repositoryLocator = new RepositoryLocator('sqlite', '/tmp/test.db', () => {});
global.server.securityManager   = new SecurityManager(new ConditionEvaluator(), global.server.repositoryLocator); 

global.server.listen(3001, function() {
    require('../../lib/routes/claim_service');
    require('../../lib/routes/realm_service');
    require('../../lib/routes/role_service');
    require('../../lib/routes/principal_service');
    require('../../lib/routes/auth_service');
});

module.exports = global.server;
