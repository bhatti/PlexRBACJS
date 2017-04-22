/*@flow*/

'use strict'

/**
 * Module Dependencies
 */
const _      = require('lodash'),
	  errors = require('restify-errors');


import {Claim}                  from '../src/domain/claim';
import {Realm}                  from '../src/domain/realm';
import {Role}                   from '../src/domain/role';
import type {RealmRepository}   from '../src/repository/interface';

const saveUpdate = async (req, res, next, successRC) => {

	if (!req.body) {
		return next(new errors.MissingParameterError('Role JSON body could not be found.'));
	}

	let json = JSON.parse(req.body);

	if (!json.roleName) {
		return next(new errors.MissingParameterError('Role JSON body is missing roleName.'));
	}

	try {
		let realm       = await global.server.repositoryLocator.realmRepository.findById(req.params.realmId);
		let role  = new Role(realm, json.roleName);
		if (json.claims) {
			json.claims.forEach(claim => {
				role.claims.add(new Claim(realm, claim.action, claim.resource, claim.condition, claim.effect));
			});
		}
		if (json.parents) {
			json.parents.forEach(async parent => {
				let parentRole = null;
				if (parent.id) {
					parentRole = await global.server.repositoryLocator.roleRepository.findById(parent.id);
				} else if (parent.roleName) {
					parentRole = await global.server.repositoryLocator.roleRepository.save(new Role(realm, parent.roleName));
				}
				role.parents.add(parentRole);
			});
		}
		//
		let saved = await global.server.repositoryLocator.roleRepository.save(role);
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
global.server.post('/realms/:realmId/roles', async (req, res, next) => {

	return saveUpdate(req, res, next, 201);

})


/**
 * LIST
 */
global.server.get('/realms/:realmId/roles', async (req, res, next) => {

	let criteria    = new Map();
	criteria.set('realm_id', Number.parseInt(req.params.realmId));
	let results = await global.server.repositoryLocator.roleRepository.search(criteria);
	res.send(results);
	next();

});


/**
 * GET
 */
global.server.get('/realms/:realmId/roles/:roleId', async (req, res, next) => {

	try {
		let realm = await global.server.repositoryLocator.roleRepository.findById(req.params.roleId);
		res.send(realm);
		next();
	} catch (err) {
		global.log.error(`Failed to get role due to ${err}`);
		next(new errors.ResourceNotFoundError('Could not find role'));
	}

});


/**
 * UPDATE
 */
global.server.put('/realms/:realmId/roles/:roleId', async (req, res, next) => {

	return saveUpdate(req, res, next, 200);

});

/**
 * DELETE
 */
global.server.del('/:realmId/roles/:roleId', async (req, res, next) => {

	try {
		let realm = await global.server.repositoryLocator.roleRepository.removeById(req.params.roleId);
		res.send(204)
		next();
	} catch (err) {
		global.log.error(`Failed to remove role due to ${err}`);
		next(new errors.ResourceNotFoundError('Could not remove role'));
	}

});
