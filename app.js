'use strict'

import {RepositoryLocator}          from './src/repository/sqlite/repository_locator';

/**
 * Module Dependencies
 */
const config        = require('./config'),
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
server.use(restify.jsonBodyParser({ mapParams: true }));
server.use(restify.acceptParser(server.acceptable));
server.use(restify.queryParser({ mapParams: true }));
server.use(restify.fullResponse());

/**
 * Error Handling
 */
server.on('uncaughtException', (req, res, route, err) => {
    log.error(`Uncaught error ${err.stack}`);
    res.send(err);
});

/**
 * Lift Server, Connect to DB & Bind Routes
 */
server.listen(config.port, () => {
    server.repositoryLocator = new RepositoryLocator('sqlite', '/tmp/test.db', () => {});
	//
    require('./routes/realm_service');
    require('./routes/role_service');
    require('./routes/principal_service');
})
