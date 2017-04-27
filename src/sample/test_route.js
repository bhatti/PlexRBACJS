/*@flow*/


/**
 * Module Dependencies
 */
const _      = require('lodash'),
	  errors = require('restify-errors');

const authCheck = (target, name, decorated) => {
  console.log(`target ${JSON.stringify(target)}, name ${JSON.stringify(name)}, decorated ${JSON.stringify(decorated)} -- ${decorated}`);
  return decorated;
};



/**
 * POST
 */
global.server.post('/realms/:realmId/principals/:principalId/test', (req, res, next) => {
    res.send(201, {'created':true});
	next();
});

/**
 * LIST
 */
global.server.get('/realms/:realmId/principals/:principalId/test', (req, res, next) => {
    res.send([{'item':1}, {'item':2}, {'item':3}]);
	next();
});

/**
 * GET
 */
global.server.get('/realms/:realmId/principals/:principalId/test/:id', (req, res, next) => {
    res.send({'item':req.params.id});
	next();
});

/**
 * PUT
 */
global.server.put('/realms/:realmId/principals/:principalId/test/:id', (req, res, next) => {
    res.send({'item':req.params.id});
	next();
});

/**
 * DELETE
 */
global.server.del('/realms/:realmId/principals/:principalId/test/:id', (req, res, next) => {
    res.send({'item':req.params.id});
	next();
});

