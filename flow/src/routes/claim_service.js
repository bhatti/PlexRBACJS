'use strict'

/**
 * Module Dependencies
 */
const _      = require('lodash'),
	  errors = require('restify-errors');

import {Claim}                  from '../domain/claim';
import {Realm}                  from '../domain/realm';
import {Role}                   from '../domain/role';
import type {RealmRepository}   from '../repository/interface';
import type {ClaimRepository}   from '../repository/interface';



const saveUpdate = async (req, res, next, successRC) => {

	if (!req.body) {
		return next(new errors.MissingParameterError('Claim JSON body could not be found.'));
	}

	let json = JSON.parse(req.body);

	if (!req.params.realmId) {
		return next(new errors.MissingParameterError('realm-id parameter could not be found.'));
	}
	if (!json.action) {
		return next(new errors.MissingParameterError('Claim JSON body is missing action.'));
	}
	if (!json.resource) {
		return next(new errors.MissingParameterError('Claim JSON body is missing resource.'));
	}

	try {
		let realm       = await global.server.repositoryLocator.realmRepository.findById(req.params.realmId);

		let claim   = new Claim(realm, json.action, json.resource, json.condition || '', json.effect || 'allow');
		//
		let saved = await global.server.repositoryLocator.claimRepository.save(claim); 
		res.send(successRC, saved);
		next();
	} catch (err) {
		global.log.error(`Failed to save ${req.body} due to ${err}`);
		return next(new errors.InternalError(err.message));
	}

};
/**
 * POST
 */
global.server.post('/realms/:realmId/claims', async (req, res, next) => {

	return saveUpdate(req, res, next, 201);

})


/**
 * LIST
 */
global.server.get('/realms/:realmId/claims', async (req, res, next) => {

	if (!req.params.realmId) {
		return next(new errors.MissingParameterError('realm-id parameter could not be found.'));
	}
	let criteria    = new Map();
	criteria.set('realm_id', Number.parseInt(req.params.realmId));
	let results = await global.server.repositoryLocator.claimRepository.search(criteria);
	res.send(results);
	next();

})


/**
 * GET
 */
global.server.get('/realms/:realmId/claims/:claimId', async (req, res, next) => {

	if (!req.params.realmId) {
		return next(new errors.MissingParameterError('realm-id parameter could not be found.'));
	}
	if (!req.params.claimId) {
		return next(new errors.MissingParameterError('claim-id parameter could not be found.'));
	}
	try {
		let realm = await global.server.repositoryLocator.claimRepository.findById(req.params.claimId);
		res.send(realm);
		next();
	} catch (err) {
		log.error(`Failed to get claim due to ${err}`);
		next(new errors.ResourceNotFoundError('Could not find claim'));
	}

})


/**
 * UPDATE
 */
global.server.put('/realms/:realmId/claims/:claimId', async (req, res, next) => {

	if (!req.params.claimId) {
		return next(new errors.MissingParameterError('claim-id parameter could not be found.'));
	}
	return saveUpdate(req, res, next, 200);

})

/**
 * DELETE
 */
global.server.del('/realms/:realmId/claims/:claimId', async (req, res, next) => {

	if (!req.params.realmId) {
		return next(new errors.MissingParameterError('realm-id parameter could not be found.'));
	}
	if (!req.params.claimId) {
		return next(new errors.MissingParameterError('claim-id parameter could not be found.'));
	}
	try {
		await global.server.repositoryLocator.claimRepository.removeById(req.params.claimId);
		res.send(204)
		next();
	} catch (err) {
		log.error(`Failed to remove claim due to ${err}`);
		next(new errors.ResourceNotFoundError('Could not remove claim'));
	}

})
