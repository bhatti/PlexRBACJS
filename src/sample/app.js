'use strict'

require("babel-core/register");
require("babel-polyfill");
const _      = require('lodash'),
	  errors = require('restify-errors');

import {RepositoryLocator}          from '../../lib/repository/repository_locator';
import {SecurityManager}            from '../../lib/manager/security_manager';
import {ConditionEvaluator}         from '../../lib/expr/expr_evaluator';
import {SecurityAccessRequest}      from '../domain/security_access_request';
import {Claim}                      from '../domain/claim';

const restify                   = require('restify');
global.server                   = restify.createServer();

global.server.use(restify.jsonBodyParser({ mapParams: true }));
global.server.use(restify.acceptParser(server.acceptable));
global.server.use(restify.queryParser({ mapParams: true }));
global.server.use(restify.fullResponse());

global.server.repositoryLocator = new RepositoryLocator('sqlite', '/tmp/test.db', () => {});
global.server.securityManager   = new SecurityManager(new ConditionEvaluator(), global.server.repositoryLocator); 

/**
 * Auth Check
 */
global.server.pre(async (req, res, next) => {
    let pathToks    = req.path().split('/');
    if (pathToks[1] != 'realms') {
		return next(new errors.NotAuthorizedError(`No realms specified in url ${req.path()}`));
    }
    if (pathToks[3] != 'principals') {
		return next(new errors.NotAuthorizedError(`No principals specified in url ${req.path()}`));
    }
    let realmId     = Number.parseInt(pathToks[2]);
    let principalId = Number.parseInt(pathToks[4]);

    let resource    = `/${pathToks[5]}`;
    try {
        let realm       = await global.server.repositoryLocator.realmRepository.findById(realmId);
        let principal   = await global.server.repositoryLocator.principalRepository.findById(principalId);

        if (principal.realm().id !== realm.id) {
            return next(new errors.NotAuthorizedError('principal-realm does not match.'));
        }

        let request    = new SecurityAccessRequest(
                            realm.realmName,
                            principal.principalName,
                            req.method,
                            resource,
                            {});
        let result = await global.server.securityManager.check(request);
        if (result != Claim.allow) {
            return next(new errors.NotAuthorizedError(`Access to perform ${req.method} ${resource}.`));
        } 
        next();
    } catch (err) {
        console.log(err);
        return next(new errors.NotAuthorizedError(`Failed to authorize ${resource}.`));
    }
});

//
global.server.listen(3001, function() {
    require('./test_route');
});

module.exports = global.server;
