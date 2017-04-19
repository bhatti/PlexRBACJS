'use strict'

import {RealmRepositorySqlite}      from './src/repository/sqlite/realm_repository';
import {ClaimRepositorySqlite}      from './src/repository/sqlite/claim_repository';
import {RoleRepositorySqlite}       from './src/repository/sqlite/role_repository';
import {PrincipalRepositorySqlite}  from './src/repository/sqlite/principal_repository';
import {DBHelper}                   from './src/repository/sqlite/db_helper';
import {DefaultSecurityCache}       from './src/cache/security_cache';


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
    server.dbHelper 		= new DBHelper('/tmp/test.db');
    server.realmRepository  = new RealmRepositorySqlite(server.dbHelper, new DefaultSecurityCache());
    server.claimRepository  = new ClaimRepositorySqlite(server.dbHelper, server.realmRepository);
    server.roleRepository   = new RoleRepositorySqlite(server.dbHelper, server.realmRepository, server.claimRepository, new DefaultSecurityCache());
    server.principalRepository = new PrincipalRepositorySqlite(server.dbHelper, server.realmRepository, server.roleRepository, server.claimRepository, new DefaultSecurityCache());

    //
    server.dbHelper.createTables(() => { });

	//
    require('./routes/realm_service');
    require('./routes/role_service');
    require('./routes/principal_service');
})
