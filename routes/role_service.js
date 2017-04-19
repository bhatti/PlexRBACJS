/*@flow*/

'use strict'

/**
 * Module Dependencies
 */
const _      = require('lodash'),
      errors = require('restify-errors');


import {RealmImpl}                  from '../src/domain/realm';
import {RoleImpl}                   from '../src/domain/role';
import type {RealmRepository}       from '../src/repository/interface';


/**
 * POST
 */
server.post('/realms/:realmId/roles', function(req, res, next) {

    if (!req.body) {
	    return next(new errors.MissingParameterError('Role JSON body could not be found.'));
    }

    let json = JSON.parse(req.body);

    try {
        let realm = new RealmImpl(Number.parseInt(req.params.realmId));
        let role  = new RoleImpl(realm, json.realmName);
        let saved = await server.roleRepository.save(role);
        res.send(201);
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
    let results = await server.roleRepository.search(criteria);
    res.send(results);
    next();

})


/**
 * GET
 */
server.get('/realms/:realmId/roles/:roleId', function(req, res, next) {

	try {
    	let realm = await server.roleRepository.findById(req.params.roleId);
        res.send(realm);
        next();
	} catch (err) {
        log.error(`Failed to get role due to ${err}`);
        next(new errors.ResourceNotFoundError('Could not find role'));
	}

})


/**
 * UPDATE
 */
server.put('/realms/:realmId/roles/:roleId', function(req, res, next) {

    let data = req.body || {}

    if (!data._id) {
		_.extend(data, {
			_id: req.params.roleId
		})
	}

    RoleImpl.findOne({ _id: req.params.roleId }, function(err, doc) {

		if (err) {
			log.error(err)
			return next(new errors.InvalidContentError(err.errors.name.message))
		} else if (!doc) {
			return next(new errors.ResourceNotFoundError('The resource you requested could not be found.'))
		}

		RoleImpl.update({ _id: data._id }, data, function(err) {


			if (err) {
				log.error(err)
				return next(new errors.InvalidContentError(err.errors.name.message))
			}


			res.send(200, data)
            next()

		})

	})

})

/**
 * DELETE
 */
server.del('/:realmId/roles/:roleId', function(req, res, next) {

    RoleImpl.remove({ _id: req.params.roleId }, function(err) {

		if (err) {
			log.error(err)
			return next(new errors.InvalidContentError(err.errors.name.message))
		}

		res.send(204)
        next()

	})

})
