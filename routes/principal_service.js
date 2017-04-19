'use strict'

/**
 * Module Dependencies
 */
const _      = require('lodash'),
      errors = require('restify-errors');



/**
 * POST
 */
server.post('/:realm_id/principals', function(req, res, next) {

    let data = req.body || {}

    let principal = new PrincipalImpl(data)
    principal.save(function(err) {

        if (err) {
            log.error(err)
            return next(new errors.InternalError(err.message))
            next()
        }

        res.send(201)
        next()

    })

})


/**
 * LIST
 */
server.get('/:realm_id/principals', function(req, res, next) {

    PrincipalImpl.apiQuery(req.params, function(err, docs) {

        if (err) {
            log.error(err)
            return next(new errors.InvalidContentError(err.errors.name.message))
        }

        res.send(docs)
        next()

    })

})


/**
 * GET
 */
server.get('/:realm_id/principals/:principal_id', function(req, res, next) {

    PrincipalImpl.findOne({ _id: req.params.principal_id }, function(err, doc) {

        if (err) {
            log.error(err)
            return next(new errors.InvalidContentError(err.errors.name.message))
        }

        res.send(doc)
        next()

    })

})


/**
 * UPDATE
 */
server.put('/:realm_id/principals/:principal_id', function(req, res, next) {

    let data = req.body || {}

    if (!data._id) {
		_.extend(data, {
			_id: req.params.principal_id
		})
	}

    PrincipalImpl.findOne({ _id: req.params.principal_id }, function(err, doc) {

		if (err) {
			log.error(err)
			return next(new errors.InvalidContentError(err.errors.name.message))
		} else if (!doc) {
			return next(new errors.ResourceNotFoundError('The resource you requested could not be found.'))
		}

		PrincipalImpl.update({ _id: data._id }, data, function(err) {


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
server.del('/:realm_id/principals/:principal_id', function(req, res, next) {

    PrincipalImpl.remove({ _id: req.params.principal_id }, function(err) {

		if (err) {
			log.error(err)
			return next(new errors.InvalidContentError(err.errors.name.message))
		}

		res.send(204)
        next()

	})

})


