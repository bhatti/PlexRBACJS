'use strict'

require("babel-core/register");
require("babel-polyfill");

import {RepositoryLocator}          from './repository/repository_locator';
import {SecurityManager}            from './manager/security_manager';
import {ConditionEvaluator}         from './expr/expr_evaluator';

/**
 * Module Dependencies
 */
const config        = require('../config'),
	  restify       = require('restify'),
	  bunyan        = require('bunyan'),
	  winston       = require('winston'),
	  bunyanWinston = require('bunyan-winston-adapter');

/**
 * Logging
 */
global.log = new winston.Logger({
	transports: [
		new winston.transports.Console({
			level: 'info',
			timestamp: () => {
				return new Date().toString()
			},
			json: true
		}),
	]
});

/**
 * Initialize Server
 */
global.server = restify.createServer({
	name    : config.name,
	version : config.version,
	log     : bunyanWinston.createAdapter(log),
});

/**
 * Middleware
 */
global.server.use(restify.jsonBodyParser({ mapParams: true }));
global.server.use(restify.acceptParser(server.acceptable));
global.server.use(restify.queryParser({ mapParams: true }));
global.server.use(restify.fullResponse());

/**
 * Error Handling
 */
global.server.on('uncaughtException', (req, res, route, err) => {
	log.error(`Uncaught error ${err.stack}`);
	res.send(err);
});

/**
 * Lift Server, Connect to DB & Bind Routes
 */
global.server.listen(config.port, () => {
	global.server.repositoryLocator = new RepositoryLocator('sqlite', '/tmp/test.db', () => {});
	global.server.securityManager   = new SecurityManager(new ConditionEvaluator(), global.server.repositoryLocator);
	//
	require('./routes/claim_service');
	require('./routes/realm_service');
	require('./routes/role_service');
	require('./routes/principal_service');
	require('./routes/auth_service');
})
