'use strict'

require("babel-core/register");
require("babel-polyfill");
const assert = require('assert');
const _      = require('lodash'),
	  errors = require('restify-errors');

import {RepositoryLocator}          from '../../lib/repository/repository_locator';
import {SecurityManager}            from '../../lib/manager/security_manager';
import {ConditionEvaluator}         from '../../lib/expr/expr_evaluator';
import {SecurityAccessRequest}      from '../domain/security_access_request';
import {Claim}                      from '../domain/claim';

const restify                   = require('restify');
const cookieParser              = require('restify-cookies');

global.server                   = restify.createServer();

global.server.pre(restify.pre.pause());
global.server.use(cookieParser.parse);
global.server.use(restify.jsonBodyParser({ mapParams: true }));
global.server.use(restify.acceptParser(server.acceptable));
global.server.use(restify.queryParser({ mapParams: true }));
global.server.use(restify.fullResponse());
global.server.use(restify.bodyParser());

/**
 * Authorization Check
 */
global.server.use(async (req, res, next) => {
    if (req.path() == '/login') {
        return next();
    } else {
        let resource    = req.path();
        try {
            cookieParser.parse(req, res, next);
            let realmId     = req.cookies['realmId'];
            let principalId = req.cookies['principalId'];
		    assert(realmId, 'realmId not specified');
		    assert(principalId, 'principalId not specified');
            let realm       = await global.server.repositoryLocator.realmRepository.findById(realmId);
            let principal   = await global.server.repositoryLocator.principalRepository.findById(principalId);
            let request    = new SecurityAccessRequest(
                                realm.realmName,
                                principal.principalName,
                                req.method,
                                resource,
                                req.params);
            let result = await global.server.securityManager.check(request);
            if (result != Claim.allow) {
                return next(new errors.UnauthorizedError(`Access to perform ${req.method} ${resource}.`));
            } else {
                return next();
            }
        } catch (err) {
            console.log(`Failed to authorize ${resource} due to ${err.stack}`);
            return next(new errors.UnauthorizedError(`Failed to authorize ${resource}.`));
        }
    }
});


global.server.repositoryLocator = new RepositoryLocator('sqlite', '/tmp/test.db', () => {});
global.server.securityManager   = new SecurityManager(new ConditionEvaluator(), global.server.repositoryLocator); 

//
global.server.listen(3001, function() {
    require('./test_route');
});

module.exports = global.server;
