'use strict'

/**
 * Module Dependencies
 */
const _      = require('lodash'),
	  errors = require('restify-errors');

import {SecurityAccessRequest}      from '../src/domain/security_access_request';
import {Claim}                      from '../src/domain/claim';




/**
 * Check for authorizaiton rule
 */
global.server.get('/realms/:realmId/principals/:principalId/authorization', async (req, res, next) => {
	if (!req.params.action) {
		return next(new errors.MissingParameterError('action parameter could not be found.'));
	}
	if (!req.params.resource) {
		return next(new errors.MissingParameterError('resource parameter could not be found.'));
	}

	let realm       = await global.server.repositoryLocator.realmRepository.findById(req.params.realmId);
	let principal   = await global.server.repositoryLocator.principalRepository.findById(req.params.principalId);

	if (principal.realm().id !== realm.id) {
		return next(new errors.InvalidArgumentError('principal-realm does not match.'));
	}

	let request    = new SecurityAccessRequest(
						realm.realmName,
						principal.principalName,
						req.params.action,
						req.params.resource,
						req.params);
	let result = await global.server.securityManager.check(request);
	if (result == Claim.allow) {
		res.send(200, `Access to perform ${req.params.action} on ${req.params.resource} is allowed.`);
		next();
	} else {
		return next(new errors.NotAuthorizedError(`Access to perform ${req.params.action} on ${req.params.resource} is denied.`));
	}
})
