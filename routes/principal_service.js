'use strict'

/**
 * Module Dependencies
 */
const _      = require('lodash'),
      errors = require('restify-errors');



/**
 * POST
 */
server.post('/realms/:realm_id/principals', function(req, res, next) {

    if (!req.body) {
	    return next(new errors.MissingParameterError('Principal JSON body could not be found.'));
    }

    let json = JSON.parse(req.body);

    if (!json.principalName) {
	    return next(new errors.MissingParameterError('Principal JSON body is missing principalName.'));
    }

    try {
        let realm       = new Realm('');
        realm.id        = Number.parseInt(req.params.realmId);
        let principal   = new Principal(realm, json.principalName);
        json.claims.forEach(claim => principal.claims.add(claim));
        json.roles.forEach(claim => principal.roles.add(role));
        //
        let saved = await server.principalRepository.save(principal);
        res.send(201, saved);
        next();
    } catch (err) {
        log.error(`Failed to save ${req.body} due to ${err}`);
        return next(new errors.InternalError(err.message));
    }

})


/**
 * LIST
 */
server.get('/realms/:realm_id/principals', function(req, res, next) {

    let criteria    = new Map();
    criteria.set('realm_id', Number.parseInt(req.params.realmId));
    let results = await server.principalsRepository.search(criteria);
    res.send(results);
    next();

})


/**
 * GET
 */
server.get('/realms/:realm_id/principals/:principalId', function(req, res, next) {

	try {
    	let realm = await server.principalRepository.findById(req.params.principalId);
        res.send(realm);
        next();
	} catch (err) {
        log.error(`Failed to get principal due to ${err}`);
        next(new errors.ResourceNotFoundError('Could not find principal'));
	}

})


/**
 * UPDATE
 */
server.put('/realms/:realm_id/principals/:principalId', function(req, res, next) {

    if (!req.body) {
	    return next(new errors.MissingParameterError('Principal JSON body could not be found.'));
    }

    let json = JSON.parse(req.body);

    if (!json.id) {
	    return next(new errors.MissingParameterError('Principal JSON body is missing id.'));
    }
    if (!json.realmName) {
	    return next(new errors.MissingParameterError('Principal JSON body is missing realmName.'));
    }

    try {
        let realm = new Realm('');
        realm.id  = Number.parseInt(req.params.realmId);
        let principal   = new Principal(realm, json.principalName);
        json.claims.forEach(claim => principal.claims.add(claim));
        json.roles.forEach(claim => principal.roles.add(role));
        //
        let saved = await server.principalRepository.save(principal);
		res.send(200, saved)
        next();
    } catch (err) {
        log.error(`Failed to save ${req.body} due to ${err}`);
        return next(new errors.InternalError(err.message));
    }

})

/**
 * DELETE
 */
server.del('/realms/:realm_id/principals/:principalId', function(req, res, next) {

	try {
    	await server.principalRepository.removeById(req.params.principalId);
		res.send(204)
        next();
	} catch (err) {
        log.error(`Failed to remove principal due to ${err}`);
        next(new errors.ResourceNotFoundError('Could not remove principal'));
	}

})


