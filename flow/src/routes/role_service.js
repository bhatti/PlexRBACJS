/*@flow*/

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

const saveUpdate = async (req, res, next, successRC) => {

    if (!req.params.realmId) {
        return next(new errors.MissingParameterError(`realm-id parameter could not be found. ${JSON.stringify(req.params)}`));
    }
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
        if (json.parents && json.parents.length > 0) {
            let promises = [];
            json.parents.forEach(async r => {
                if (r.id) {
                    promises.push(global.server.repositoryLocator.roleRepository.findById(r.id).then(parentRole => {
                        role.parents.add(parentRole);
                    }));
                } else if (r.roleName) {
                    promises.push(global.server.repositoryLocator.roleRepository.findByName(realm.realmName, r.roleName).then(parentRole => {
                        role.parents.add(parentRole);
                    }));
                }
            });
            await Promise.all(promises)
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

    if (!req.params.realmId) {
        return next(new errors.MissingParameterError('realm-id parameter could not be found.'));
    }
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

    if (!req.params.realmId) {
        return next(new errors.MissingParameterError('realm-id parameter could not be found.'));
    }
    if (!req.params.roleId) {
        return next(new errors.MissingParameterError('role-id parameter could not be found.'));
    }
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

    if (!req.params.realmId) {
        return next(new errors.MissingParameterError('realm-id parameter could not be found.'));
    }
    if (!req.params.roleId) {
        return next(new errors.MissingParameterError('role-id parameter could not be found.'));
    }
    return saveUpdate(req, res, next, 200);

});

/**
 * DELETE
 */
global.server.del('/realms/:realmId/roles/:roleId', async (req, res, next) => {
    if (!req.params.realmId) {
        return next(new errors.MissingParameterError('realm-id parameter could not be found.'));
    }
    if (!req.params.roleId) {
        return next(new errors.MissingParameterError('role-id parameter could not be found.'));
    }

    try {
        let realm = await global.server.repositoryLocator.roleRepository.removeById(req.params.roleId);
        res.send(204)
        next();
    } catch (err) {
        global.log.error(`Failed to remove role due to ${err}`);
        next(new errors.ResourceNotFoundError('Could not remove role'));
    }

});
