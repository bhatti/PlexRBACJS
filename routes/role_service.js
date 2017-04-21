/*@flow*/

'use strict'

/**
 * Module Dependencies
 */
const _      = require('lodash'),
      errors = require('restify-errors');


import {Realm}                  from '../src/domain/realm';
import {Role}                   from '../src/domain/role';
import type {RealmRepository}   from '../src/repository/interface';


/**
 * POST
 */
server.post('/realms/:realmId/roles', function(req, res, next) {

    if (!req.body) {
	    return next(new errors.MissingParameterError('Role JSON body could not be found.'));
    }

    let json = JSON.parse(req.body);

    if (!json.realmName) {
	    return next(new errors.MissingParameterError('Role JSON body is missing realmName.'));
    }

    try {
        let realm = new Realm('');
        realm.id  = Number.parseInt(req.params.realmId);
        let role  = new Role(realm, json.realmName);
        json.claims.forEach(claim => role.claims.add(claim));
        //
        let saved = await server.repositoryLocator.roleRepository.save(role);
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
server.get('/realms/:realmId/roles', function(req, res, next) {

    let criteria    = new Map();
    criteria.set('realm_id', Number.parseInt(req.params.realmId));
    let results = await server.repositoryLocator.roleRepository.search(criteria);
    res.send(results);
    next();

});


/**
 * GET
 */
server.get('/realms/:realmId/roles/:roleId', function(req, res, next) {

	try {
    	let realm = await server.repositoryLocator.roleRepository.findById(req.params.roleId);
        res.send(realm);
        next();
	} catch (err) {
        log.error(`Failed to get role due to ${err}`);
        next(new errors.ResourceNotFoundError('Could not find role'));
	}

});


/**
 * UPDATE
 */
server.put('/realms/:realmId/roles/:roleId', function(req, res, next) {

    if (!req.body) {
	    return next(new errors.MissingParameterError('Role JSON body could not be found.'));
    }

    let json = JSON.parse(req.body);

    if (!json.id) {
	    return next(new errors.MissingParameterError('Role JSON body is missing id.'));
    }
    if (!json.realmName) {
	    return next(new errors.MissingParameterError('Role JSON body is missing realmName.'));
    }

    try {
        let realm = new Realm('');
        realm.id  = Number.parseInt(req.params.realmId);
        let role  = new Role(realm, json.realmName);
        role.id   = json.id;
        json.claims.forEach(claim => role.claims.add(claim));
        //
        let saved = await server.repositoryLocator.roleRepository.save(role);
		res.send(200, saved)
        next();
    } catch (err) {
        log.error(`Failed to save ${req.body} due to ${err}`);
        return next(new errors.InternalError(err.message));
    }

});

/**
 * DELETE
 */
server.del('/:realmId/roles/:roleId', function(req, res, next) {

	try {
    	let realm = await server.repositoryLocator.roleRepository.removeById(req.params.roleId);
		res.send(204)
        next();
	} catch (err) {
        log.error(`Failed to remove role due to ${err}`);
        next(new errors.ResourceNotFoundError('Could not remove role'));
	}

});
