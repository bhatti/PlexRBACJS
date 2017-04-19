/*@flow*/

'use strict'

/**
 * Module Dependencies
 */
const _      = require('lodash'),
      errors = require('restify-errors');


import {RealmImpl}                  from '../src/domain/realm';
import type {RealmRepository}       from '../src/repository/interface';

/**
 * POST
 */
server.post('/realms', async (req, res, next) => {
    if (!req.body) {
	    return next(new errors.MissingParameterError('Realm JSON body could not be found.'));
    }

    let json = JSON.parse(req.body);
	//
    try {
        let realm = new RealmImpl(json.realmName);
        let saved = await server.realmRepository.save(realm);
        res.send(201);
        next();
    } catch (err) {
        log.error(`Failed to save ${req.body} due to ${err}`);
        return next(new errors.InternalError(err.message));
    }
});


/**
 * LIST
 */
server.get('/realms', async (req, res, next) => {

    let criteria    = new Map();
    let results = await server.realmRepository.search(criteria);
    res.send(results);
    next();

});


/**
 * GET
 */
server.get('/realms/:realmId', async (req, res, next) => {

	try {
    	let realm = await server.realmRepository.findById(req.params.realmId);
        res.send(realm);
        next();
	} catch (err) {
        log.error(`Failed to get realm due to ${err}`);
        next(new errors.ResourceNotFoundError('Could not find realm'));
	}

});
