/*@flow*/

'use strict'

/**
 * Module Dependencies
 */
const _      = require('lodash'),
	  errors = require('restify-errors');


import {Realm}                  from '../src/domain/realm';
import type {RealmRepository}   from '../src/repository/interface';

/**
 * POST
 */
global.server.post('/realms', async (req, res, next) => {
	if (!req.body) {
		return next(new errors.MissingParameterError('Realm JSON body could not be found.'));
	}

	let json = JSON.parse(req.body);
	//
	try {
		let realm = new Realm(json.realmName);
		let saved = await global.server.repositoryLocator.realmRepository.save(realm);
		res.send(201, saved);
		next();
	} catch (err) {
		global.log.error(`Failed to save ${req.body} due to ${err}`);
		return next(new errors.InternalError(err.message));
	}
});


/**
 * LIST
 */
global.server.get('/realms', async (req, res, next) => {

	let criteria    = new Map();
	let results = await global.server.repositoryLocator.realmRepository.search(criteria);
	res.send(results);
	next();

});


/**
 * GET
 */
global.server.get('/realms/:realmId', async (req, res, next) => {

	try {
		let realm = await global.server.repositoryLocator.realmRepository.findById(req.params.realmId);
		res.send(realm);
		next();
	} catch (err) {
		global.log.error(`Failed to get realm due to ${err}`);
		next(new errors.ResourceNotFoundError('Could not find realm'));
	}

});
