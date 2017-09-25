'use strict'

/**
 * Module Dependencies
 */
const _      = require('lodash'),
      errors = require('restify-errors');

import {Limit}             from '../domain/limit';
import {Realm}                  from '../domain/realm';
import {Role}                   from '../domain/role';
import type {RealmRepository}   from '../repository/interface';
import type {LimitRepository}   from '../repository/interface';



const saveUpdate = async (req, res, next, successRC) => {

    if (!req.body) {
        return next(new errors.MissingParameterError('limit JSON body could not be found.'));
    }

    let json = JSON.parse(req.body);

    if (!json.type) {
        return next(new errors.MissingParameterError('limit JSON body is missing type.'));
    }
    if (!json.resource) {
        return next(new errors.MissingParameterError('limit JSON body is missing resource.'));
    }
    if (!json.maxAllowed) {
        return next(new errors.MissingParameterError('limit JSON body is missing maxAllowed.'));
    }
    if (!json.value) {
        return next(new errors.MissingParameterError('limit JSON body is missing value.'));
    }

    try {
        let limit   = new Limit(json.type, json.resource, json.maxAllowed, json.value, json.expirationDate);
        limit.principal = new Principal();
        limit.principal.id = req.params.principalId;
        //
        let saved = await global.server.repositoryLocator.limitRepository.save(limit);
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
global.server.post('/principals/:principalId/limits', async (req, res, next) => {
    if (!req.params.principalId) {
        return next(new errors.MissingParameterError('principal-id parameter could not be found.'));
    }

    return saveUpdate(req, res, next, 201);

})


/**
 * LIST
 */
global.server.get('/principals/:principalId/limits', async (req, res, next) => {

    if (!req.params.principalId) {
        return next(new errors.MissingParameterError('principal-id parameter could not be found.'));
    }
    let criteria    = new Map();
    criteria.set('principal_id', Number.parseInt(req.params.principalId));
    let results = await global.server.repositoryLocator.limitRepository.search(criteria);
    res.send(results);
    next();

})


/**
 * GET
 */
global.server.get('/principals/:principalId/limits/:limitId', async (req, res, next) => {

    if (!req.params.principalId) {
        return next(new errors.MissingParameterError('principal-id parameter could not be found.'));
    }
    if (!req.params.limitId) {
        return next(new errors.MissingParameterError('limitId parameter could not be found.'));
    }
    try {
        let realm = await global.server.repositoryLocator.LimitRepository.findById(req.params.limitId);
        res.send(realm);
        next();
    } catch (err) {
        log.error(`Failed to get Limit due to ${err}`);
        next(new errors.ResourceNotFoundError('Could not find Limit'));
    }

})


/**
 * UPDATE
 */
global.server.put('/principals/:principalId/limits/:limitId', async (req, res, next) => {

    if (!req.params.principalId) {
        return next(new errors.MissingParameterError('principal-id parameter could not be found.'));
    }
    if (!req.params.limitId) {
        return next(new errors.MissingParameterError('limitId parameter could not be found.'));
    }
    return saveUpdate(req, res, next, 200);

})

/**
 * DELETE
 */
global.server.del('/principals/:principalId/limits/:limitId', async (req, res, next) => {

    if (!req.params.principalId) {
        return next(new errors.MissingParameterError('principal-id parameter could not be found.'));
    }
    if (!req.params.limitId) {
        return next(new errors.MissingParameterError('limitId parameter could not be found.'));
    }
    try {
        await global.server.repositoryLocator.LimitRepository.removeById(req.params.limitId);
        res.send(204)
        next();
    } catch (err) {
        log.error(`Failed to remove Limit due to ${err}`);
        next(new errors.ResourceNotFoundError('Could not remove Limit'));
    }

})
