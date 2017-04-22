'use strict'

/**
 * Module Dependencies
 */
const _      = require('lodash'),
	  errors = require('restify-errors');

import {Principal}              from '../src/domain/principal';
import {Realm}                  from '../src/domain/realm';
import {Role}                   from '../src/domain/role';
import type {RealmRepository}   from '../src/repository/interface';
import type {PrincipalRepository}   from '../src/repository/interface';



const saveUpdate = async (req, res, next, successRC) => {

	if (!req.body) {
		return next(new errors.MissingParameterError('Principal JSON body could not be found.'));
	}

	let json = JSON.parse(req.body);

	if (!json.principalName) {
		return next(new errors.MissingParameterError('Principal JSON body is missing principalName.'));
	}

	try {
		let realm       = await global.server.repositoryLocator.realmRepository.findById(req.params.realmId);

		let principal   = new Principal(realm, json.principalName);
		//
		if (json.claims) {
			json.claims.forEach(claim => {
				principal.claims.add(new Claim(realm, claim.action, claim.resource, claim.condition, claim.effect));
			});
		}
		if (json.roles) {
			json.roles.forEach(async r => {
				let role = null;
				if (r.id) {
					role = await global.server.repositoryLocator.roleRepository.findById(r.id);
				} else if (r.roleName) {
					role = await global.server.repositoryLocator.roleRepository.save(new Role(realm, r.roleName));
				}
				principal.roles.add(role);
			});
		}
		//
		let saved = await global.server.repositoryLocator.principalRepository.save(principal);
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
global.server.post('/realms/:realmId/principals', async (req, res, next) => {

	return saveUpdate(req, res, next, 201);

})


/**
 * LIST
 */
global.server.get('/realms/:realmId/principals', async (req, res, next) => {

	let criteria    = new Map();
	criteria.set('realm_id', Number.parseInt(req.params.realmId));
	let results = await global.server.repositoryLocator.principalRepository.search(criteria);
	res.send(results);
	next();

})


/**
 * GET
 */
global.server.get('/realms/:realmId/principals/:principalId', async (req, res, next) => {

	try {
		let realm = await global.server.repositoryLocator.principalRepository.findById(req.params.principalId);
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
global.server.put('/realms/:realmId/principals/:principalId', async (req, res, next) => {

	return saveUpdate(req, res, next, 200);

})

/**
 * DELETE
 */
global.server.del('/realms/:realmId/principals/:principalId', async (req, res, next) => {

	try {
		await global.server.repositoryLocator.principalRepository.removeById(req.params.principalId);
		res.send(204)
		next();
	} catch (err) {
		log.error(`Failed to remove principal due to ${err}`);
		next(new errors.ResourceNotFoundError('Could not remove principal'));
	}

})
