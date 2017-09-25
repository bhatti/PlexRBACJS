/*@flow*/


/**
 * Module Dependencies
 */
const _      = require('lodash'),
	  errors = require('restify-errors');

/**
 * LOGIN
 */
global.server.post('/login', (req, res, next) => {
    res.setCookie('principalId', req.params.principalId);
    res.setCookie('realmId', req.params.realmId);
    res.send({'authenticated':true});
	next();
});

/**
 * POST
 */
global.server.post('/test', (req, res, next) => {
    res.send(201, {'created':true});
	next();
});

/**
 * LIST
 */
global.server.get('/test', (req, res, next) => {
    res.send([{'item':1}, {'item':2}, {'item':3}]);
	next();
});

/**
 * GET
 */
global.server.get('/test/:id', (req, res, next) => {
    res.send({'item':req.params.id});
	next();
});

/**
 * PUT
 */
global.server.put('/test/:id', (req, res, next) => {
    res.send({'item':req.params.id});
	next();
});

/**
 * DELETE
 */
global.server.del('/test/:id', (req, res, next) => {
    res.send({'item':req.params.id});
	next();
});

