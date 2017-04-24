'use strict';

var _repository_locator = require("./repository/repository_locator");

var _security_manager = require("./manager/security_manager");

var _expr_evaluator = require("./expr/expr_evaluator");

require("babel-core/register");
require("babel-polyfill");

/**
 * Module Dependencies
 */
var config = require('../config'),
    restify = require('restify'),
    bunyan = require('bunyan'),
    winston = require('winston'),
    bunyanWinston = require('bunyan-winston-adapter');

/**
 * Logging
 */
global.log = new winston.Logger({
	transports: [new winston.transports.Console({
		level: 'info',
		timestamp: function timestamp() {
			return new Date().toString();
		},
		json: true
	})]
});

/**
 * Initialize Server
 */
global.server = restify.createServer({
	name: config.name,
	version: config.version,
	log: bunyanWinston.createAdapter(log)
});

/**
 * Middleware
 */
server.use(restify.jsonBodyParser({ mapParams: true }));
server.use(restify.acceptParser(server.acceptable));
server.use(restify.queryParser({ mapParams: true }));
server.use(restify.fullResponse());

/**
 * Error Handling
 */
server.on('uncaughtException', function (req, res, route, err) {
	log.error("Uncaught error " + err.stack);
	res.send(err);
});

/**
 * Lift Server, Connect to DB & Bind Routes
 */
server.listen(config.port, function () {
	server.repositoryLocator = new _repository_locator.RepositoryLocator('sqlite', '/tmp/test.db', function () {});
	server.securityManager = new _security_manager.SecurityManager(new _expr_evaluator.ConditionEvaluator(), server.repositoryLocator);
	//
	require('./routes/claim_service');
	require('./routes/realm_service');
	require('./routes/role_service');
	require('./routes/principal_service');
	require('./routes/auth_service');
});

