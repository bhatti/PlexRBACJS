'use strict';

/*  Interface file */

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.RbacCli = undefined;

var _map = require('babel-runtime/core-js/map');

var _map2 = _interopRequireDefault(_map);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _claim = require('../domain/claim');

var _realm = require('../domain/realm');

var _principal = require('../domain/principal');

var _role = require('../domain/role');

var _persistence_error = require('../repository/persistence_error');

var _auth_error = require('../domain/auth_error');

var _repository_locator = require('../repository/repository_locator');

var _security_access_request = require('../domain/security_access_request');

var _security_manager = require('../manager/security_manager');

var _expr_evaluator = require('../expr/expr_evaluator');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var assert = require('assert');
var commandLineArgs = require('command-line-args');
var getUsage = require('command-line-usage');

var optionDefinitions = [{ name: 'dbPath', alias: 'd', type: String }, { name: 'method', alias: 'm', type: String }, { name: 'realmName', type: String }, { name: 'roleName', type: String }, { name: 'principalName', type: String }, { name: 'action', type: String }, { name: 'resource', type: String }, { name: 'condition', type: String }, { name: 'realmId', type: Number }, { name: 'roleId', type: Number }, { name: 'principalId', type: Number }, { name: 'variable', type: String, multiple: true }, { name: 'claimId', type: String, multiple: true }];

var sections = [{
  header: 'rbac_cli',
  content: 'Command line interface for managing roles/claims/principals'
}, {
  header: 'Options',
  optionList: [{
    name: 'method',
    typeLabel: '[addRealm|showRealms|removeRealm|addRole|showRoles|removeRole|addClaim|showClaims|removeClaim|addPrincipal|showPrincipals|removePrincipal|check]',
    descripton: 'method to perform'
  }, {
    name: 'realmId',
    typeLabel: 'numeric id',
    descripton: 'realm-id'
  }, {
    name: 'principalId',
    typeLabel: 'numeric id',
    descripton: 'principal-id'
  }, {
    name: 'claimId',
    typeLabel: 'numeric id',
    descripton: 'claim-id'
  }, {
    name: 'realmName',
    typeLabel: 'string',
    descripton: 'realm-name'
  }, {
    name: 'roleName',
    typeLabel: 'string',
    descripton: 'role-name'
  }, {
    name: 'principalName',
    typeLabel: 'string',
    descripton: 'principal-name'
  }, {
    name: 'action',
    typeLabel: 'string',
    descripton: 'action-name for claim'
  }, {
    name: 'resource',
    typeLabel: 'string',
    descripton: 'resource for claim'
  }, {
    name: 'condition',
    typeLabel: 'string',
    descripton: 'condition for claim'
  }, {
    name: 'variable',
    typeLabel: 'string variable=value',
    descripton: 'variable=value'
  }]
}];

var options = commandLineArgs(optionDefinitions, { partial: true });

var RbacCli = exports.RbacCli = function () {
  function RbacCli(dbPath) {
    (0, _classCallCheck3.default)(this, RbacCli);

    this.repositoryLocator = new _repository_locator.RepositoryLocator('sqlite', dbPath, function () {});
    this.securityManager = new _security_manager.SecurityManager(new _expr_evaluator.ConditionEvaluator(), this.repositoryLocator);
  }

  /**
   * This method retrieves principal by name
   * @param {*} realmName - domain of application
   * @param {*} principalName - to look
   * @return principal
   */


  (0, _createClass3.default)(RbacCli, [{
    key: 'getPrincipalByName',
    value: function () {
      var _ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee(realmName, principalName) {
        return _regenerator2.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                return _context.abrupt('return', this.repositoryLocator.principalRepository.findByName(realmName, principalName));

              case 1:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function getPrincipalByName(_x, _x2) {
        return _ref.apply(this, arguments);
      }

      return getPrincipalByName;
    }()
    /**
     * This method retrieves principal by id
     * @return principal
     */

  }, {
    key: 'getPrincipalById',
    value: function () {
      var _ref2 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee2(id) {
        return _regenerator2.default.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                return _context2.abrupt('return', this.repositoryLocator.principalRepository.findById(id));

              case 1:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function getPrincipalById(_x3) {
        return _ref2.apply(this, arguments);
      }

      return getPrincipalById;
    }()

    /**
     * This method retrieves principal 
     * @param {*} realmId - domain of application
     * @return array of principals
     */

  }, {
    key: 'getPrincipals',
    value: function () {
      var _ref3 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee3(realmId) {
        var criteria;
        return _regenerator2.default.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                assert(realmId, 'realmId not specified');
                criteria = new _map2.default();

                criteria.set('realm_id', realmId);
                _context3.next = 5;
                return this.repositoryLocator.principalRepository.search(criteria);

              case 5:
                return _context3.abrupt('return', _context3.sent);

              case 6:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function getPrincipals(_x4) {
        return _ref3.apply(this, arguments);
      }

      return getPrincipals;
    }()

    /**
     * This method saves principal
     * @param {*} principal - to save
     */

  }, {
    key: 'addPrincipal',
    value: function () {
      var _ref4 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee4(principal) {
        return _regenerator2.default.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                return _context4.abrupt('return', this.repositoryLocator.principalRepository.save(principal));

              case 1:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function addPrincipal(_x5) {
        return _ref4.apply(this, arguments);
      }

      return addPrincipal;
    }()

    /**
     * This method saves principal
     * @param {*} principal - to save
     */

  }, {
    key: 'addPrincipalArgs',
    value: function () {
      var _ref5 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee5(realmId, principalName, claimIds, roleIds) {
        var realm, principal, i;
        return _regenerator2.default.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                assert(realmId, 'realmId not specified');
                assert(principalName, 'principalName not specified');
                _context5.next = 4;
                return this.repositoryLocator.realmRepository.findById(realmId);

              case 4:
                realm = _context5.sent;
                principal = new _principal.Principal(realm, principalName);
                //

                if (!(claimIds && claimIds.length > 0)) {
                  _context5.next = 17;
                  break;
                }

                i = 0;

              case 8:
                if (!(i < claimIds.length)) {
                  _context5.next = 17;
                  break;
                }

                _context5.t0 = principal.claims;
                _context5.next = 12;
                return this.repositoryLocator.claimRepository.findById(claimIds[i]);

              case 12:
                _context5.t1 = _context5.sent;

                _context5.t0.add.call(_context5.t0, _context5.t1);

              case 14:
                i++;
                _context5.next = 8;
                break;

              case 17:
                if (!(roleIds && roleIds.length > 0)) {
                  _context5.next = 28;
                  break;
                }

                i = 0;

              case 19:
                if (!(i < roleIds.length)) {
                  _context5.next = 28;
                  break;
                }

                _context5.t2 = principal.roles;
                _context5.next = 23;
                return this.repositoryLocator.roleRepository.findById(roleIds[i]);

              case 23:
                _context5.t3 = _context5.sent;

                _context5.t2.add.call(_context5.t2, _context5.t3);

              case 25:
                i++;
                _context5.next = 19;
                break;

              case 28:
                _context5.next = 30;
                return this.addPrincipal(principal);

              case 30:
                return _context5.abrupt('return', _context5.sent);

              case 31:
              case 'end':
                return _context5.stop();
            }
          }
        }, _callee5, this);
      }));

      function addPrincipalArgs(_x6, _x7, _x8, _x9) {
        return _ref5.apply(this, arguments);
      }

      return addPrincipalArgs;
    }()

    /**
     * This method removes principal
     * @param {*} principal - to remove
     * @return true if successfully removed
     */

  }, {
    key: 'removePrincipal',
    value: function () {
      var _ref6 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee6(principalId) {
        return _regenerator2.default.wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                return _context6.abrupt('return', this.repositoryLocator.principalRepository.removeById(principalId));

              case 1:
              case 'end':
                return _context6.stop();
            }
          }
        }, _callee6, this);
      }));

      function removePrincipal(_x10) {
        return _ref6.apply(this, arguments);
      }

      return removePrincipal;
    }()

    /**
     * This method adds realm
     * @param {*} realm - realm
     * @return - realm
     */

  }, {
    key: 'addRealm',
    value: function () {
      var _ref7 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee7(realm) {
        return _regenerator2.default.wrap(function _callee7$(_context7) {
          while (1) {
            switch (_context7.prev = _context7.next) {
              case 0:
                return _context7.abrupt('return', this.repositoryLocator.realmRepository.save(realm));

              case 1:
              case 'end':
                return _context7.stop();
            }
          }
        }, _callee7, this);
      }));

      function addRealm(_x11) {
        return _ref7.apply(this, arguments);
      }

      return addRealm;
    }()
    /**
     * This method removes realm
     * @param {*} id of realm
     * @return true if successfully removed
     */

  }, {
    key: 'removeRealm',
    value: function () {
      var _ref8 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee8(id) {
        return _regenerator2.default.wrap(function _callee8$(_context8) {
          while (1) {
            switch (_context8.prev = _context8.next) {
              case 0:
                return _context8.abrupt('return', this.repositoryLocator.realmRepository.removeById(id));

              case 1:
              case 'end':
                return _context8.stop();
            }
          }
        }, _callee8, this);
      }));

      function removeRealm(_x12) {
        return _ref8.apply(this, arguments);
      }

      return removeRealm;
    }()
  }, {
    key: 'addRealmArgs',
    value: function () {
      var _ref9 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee9(realmName) {
        var realm;
        return _regenerator2.default.wrap(function _callee9$(_context9) {
          while (1) {
            switch (_context9.prev = _context9.next) {
              case 0:
                assert(realmName, 'realmName not specified');
                realm = new _realm.Realm(realmName);
                _context9.next = 4;
                return this.repositoryLocator.realmRepository.save(realm);

              case 4:
                return _context9.abrupt('return', _context9.sent);

              case 5:
              case 'end':
                return _context9.stop();
            }
          }
        }, _callee9, this);
      }));

      function addRealmArgs(_x13) {
        return _ref9.apply(this, arguments);
      }

      return addRealmArgs;
    }()

    /**
     * This method retrieves realm by realm-name
     * @param {*} realmName - realm-name
     * @return - realm
     */

  }, {
    key: 'getRealm',
    value: function () {
      var _ref10 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee10(realmName) {
        return _regenerator2.default.wrap(function _callee10$(_context10) {
          while (1) {
            switch (_context10.prev = _context10.next) {
              case 0:
                return _context10.abrupt('return', this.repositoryLocator.realmRepository.findByName(realmName));

              case 1:
              case 'end':
                return _context10.stop();
            }
          }
        }, _callee10, this);
      }));

      function getRealm(_x14) {
        return _ref10.apply(this, arguments);
      }

      return getRealm;
    }()

    /**
     * This method retrieves realms
     * @return - array of realms
     */

  }, {
    key: 'getRealms',
    value: function () {
      var _ref11 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee11() {
        var criteria;
        return _regenerator2.default.wrap(function _callee11$(_context11) {
          while (1) {
            switch (_context11.prev = _context11.next) {
              case 0:
                criteria = new _map2.default();
                _context11.next = 3;
                return this.repositoryLocator.realmRepository.search(criteria);

              case 3:
                return _context11.abrupt('return', _context11.sent);

              case 4:
              case 'end':
                return _context11.stop();
            }
          }
        }, _callee11, this);
      }));

      function getRealms() {
        return _ref11.apply(this, arguments);
      }

      return getRealms;
    }()

    /**
     * This method adds role
     * @param {*} role - to save
     * @return - saved role
     */

  }, {
    key: 'addRole',
    value: function () {
      var _ref12 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee12(role) {
        return _regenerator2.default.wrap(function _callee12$(_context12) {
          while (1) {
            switch (_context12.prev = _context12.next) {
              case 0:
                return _context12.abrupt('return', this.repositoryLocator.roleRepository.save(role));

              case 1:
              case 'end':
                return _context12.stop();
            }
          }
        }, _callee12, this);
      }));

      function addRole(_x15) {
        return _ref12.apply(this, arguments);
      }

      return addRole;
    }()

    /**
     * This method adds role
     * @param {*} role - to save
     * @return - saved role
     */

  }, {
    key: 'addRoleArgs',
    value: function () {
      var _ref13 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee13(realmId, roleName, claimIds, parentIds) {
        var realm, role, i;
        return _regenerator2.default.wrap(function _callee13$(_context13) {
          while (1) {
            switch (_context13.prev = _context13.next) {
              case 0:
                assert(realmId, 'realmId not specified');
                assert(roleName, 'roleName not specified');
                _context13.next = 4;
                return this.repositoryLocator.realmRepository.findById(realmId);

              case 4:
                realm = _context13.sent;
                role = new _role.Role(realm, roleName);
                //

                if (!(claimIds && claimIds.length > 0)) {
                  _context13.next = 17;
                  break;
                }

                i = 0;

              case 8:
                if (!(i < claimIds.length)) {
                  _context13.next = 17;
                  break;
                }

                _context13.t0 = role.claims;
                _context13.next = 12;
                return this.repositoryLocator.claimRepository.findById(claimIds[i]);

              case 12:
                _context13.t1 = _context13.sent;

                _context13.t0.add.call(_context13.t0, _context13.t1);

              case 14:
                i++;
                _context13.next = 8;
                break;

              case 17:
                if (!(parentIds && parentIds.length > 0)) {
                  _context13.next = 28;
                  break;
                }

                i = 0;

              case 19:
                if (!(i < parentIds.length)) {
                  _context13.next = 28;
                  break;
                }

                _context13.t2 = role.parents;
                _context13.next = 23;
                return this.repositoryLocator.roleRepository.findById(parentIds[i]);

              case 23:
                _context13.t3 = _context13.sent;

                _context13.t2.add.call(_context13.t2, _context13.t3);

              case 25:
                i++;
                _context13.next = 19;
                break;

              case 28:
                _context13.next = 30;
                return this.addRole(role);

              case 30:
                return _context13.abrupt('return', _context13.sent);

              case 31:
              case 'end':
                return _context13.stop();
            }
          }
        }, _callee13, this);
      }));

      function addRoleArgs(_x16, _x17, _x18, _x19) {
        return _ref13.apply(this, arguments);
      }

      return addRoleArgs;
    }()

    /**
     * This method retrieves roles
     * @return - array of roles
     */

  }, {
    key: 'getRoles',
    value: function () {
      var _ref14 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee14(realmId) {
        var criteria;
        return _regenerator2.default.wrap(function _callee14$(_context14) {
          while (1) {
            switch (_context14.prev = _context14.next) {
              case 0:
                assert(realmId, 'realmId not specified');

                criteria = new _map2.default();

                criteria.set('realm_id', realmId);
                _context14.next = 5;
                return this.repositoryLocator.roleRepository.search(criteria);

              case 5:
                return _context14.abrupt('return', _context14.sent);

              case 6:
              case 'end':
                return _context14.stop();
            }
          }
        }, _callee14, this);
      }));

      function getRoles(_x20) {
        return _ref14.apply(this, arguments);
      }

      return getRoles;
    }()
  }, {
    key: 'getRole',
    value: function () {
      var _ref15 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee15(roleId) {
        return _regenerator2.default.wrap(function _callee15$(_context15) {
          while (1) {
            switch (_context15.prev = _context15.next) {
              case 0:
                assert(roleId, 'roleIdnot specified');

                _context15.next = 3;
                return this.repositoryLocator.roleRepository.findById(roleId);

              case 3:
                return _context15.abrupt('return', _context15.sent);

              case 4:
              case 'end':
                return _context15.stop();
            }
          }
        }, _callee15, this);
      }));

      function getRole(_x21) {
        return _ref15.apply(this, arguments);
      }

      return getRole;
    }()

    /**
     * This method remove role
     * @param {*} role - to delete
     * @return true if successfully removed
     */

  }, {
    key: 'removeRole',
    value: function () {
      var _ref16 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee16(role) {
        return _regenerator2.default.wrap(function _callee16$(_context16) {
          while (1) {
            switch (_context16.prev = _context16.next) {
              case 0:
                return _context16.abrupt('return', this.repositoryLocator.roleRepository.removeById(role.id));

              case 1:
              case 'end':
                return _context16.stop();
            }
          }
        }, _callee16, this);
      }));

      function removeRole(_x22) {
        return _ref16.apply(this, arguments);
      }

      return removeRole;
    }()

    /**
     * This method adds claim
     * @param {*} claim - to save
     */

  }, {
    key: 'addClaim',
    value: function () {
      var _ref17 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee17(claim) {
        return _regenerator2.default.wrap(function _callee17$(_context17) {
          while (1) {
            switch (_context17.prev = _context17.next) {
              case 0:
                return _context17.abrupt('return', this.repositoryLocator.claimRepository.save(claim));

              case 1:
              case 'end':
                return _context17.stop();
            }
          }
        }, _callee17, this);
      }));

      function addClaim(_x23) {
        return _ref17.apply(this, arguments);
      }

      return addClaim;
    }()
  }, {
    key: 'addClaimArgs',
    value: function () {
      var _ref18 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee18(realmId, action, resource, condition, effect) {
        var realm, claim;
        return _regenerator2.default.wrap(function _callee18$(_context18) {
          while (1) {
            switch (_context18.prev = _context18.next) {
              case 0:
                assert(realmId, 'realmId not specified');
                assert(action, 'action not specified');
                assert(resource, 'resource not specified');

                _context18.next = 5;
                return this.repositoryLocator.realmRepository.findById(realmId);

              case 5:
                realm = _context18.sent;
                claim = new _claim.Claim(realm, action, resource, condition || '', effect || _claim.Claim.allow);
                //

                return _context18.abrupt('return', this.addClaim(claim));

              case 8:
              case 'end':
                return _context18.stop();
            }
          }
        }, _callee18, this);
      }));

      function addClaimArgs(_x24, _x25, _x26, _x27, _x28) {
        return _ref18.apply(this, arguments);
      }

      return addClaimArgs;
    }()

    /**
     * This method removes claim
     * @param {*} claim
     * @return true if successfully removed
     */

  }, {
    key: 'removeClaim',
    value: function () {
      var _ref19 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee19(id) {
        return _regenerator2.default.wrap(function _callee19$(_context19) {
          while (1) {
            switch (_context19.prev = _context19.next) {
              case 0:
                return _context19.abrupt('return', this.repositoryLocator.claimRepository.removeById(id));

              case 1:
              case 'end':
                return _context19.stop();
            }
          }
        }, _callee19, this);
      }));

      function removeClaim(_x29) {
        return _ref19.apply(this, arguments);
      }

      return removeClaim;
    }()

    /**
     * This method returns claims
     * @param {*} realmId
     * @param {*} offset
     * @param {*} max
     * @return list of claims
     */

  }, {
    key: 'getClaims',
    value: function () {
      var _ref20 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee20(realmId, offset, max) {
        var criteria;
        return _regenerator2.default.wrap(function _callee20$(_context20) {
          while (1) {
            switch (_context20.prev = _context20.next) {
              case 0:
                assert(realmId, 'realmId not specified');
                criteria = new _map2.default();

                criteria.set('realm_id', realmId);
                _context20.next = 5;
                return this.repositoryLocator.claimRepository.search(criteria);

              case 5:
                return _context20.abrupt('return', _context20.sent);

              case 6:
              case 'end':
                return _context20.stop();
            }
          }
        }, _callee20, this);
      }));

      function getClaims(_x30, _x31, _x32) {
        return _ref20.apply(this, arguments);
      }

      return getClaims;
    }()

    /**
     * This method returns a claim by id
     * @param {*} claimId
     * @return list of claims
     */

  }, {
    key: 'getClaim',
    value: function () {
      var _ref21 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee21(claimId) {
        return _regenerator2.default.wrap(function _callee21$(_context21) {
          while (1) {
            switch (_context21.prev = _context21.next) {
              case 0:
                assert(claimId, 'claimId not specified');
                _context21.next = 3;
                return this.repositoryLocator.claimRepository.findById(claimId);

              case 3:
                return _context21.abrupt('return', _context21.sent);

              case 4:
              case 'end':
                return _context21.stop();
            }
          }
        }, _callee21, this);
      }));

      function getClaim(_x33) {
        return _ref21.apply(this, arguments);
      }

      return getClaim;
    }()

    /**
     * This method remove set of roles as parent
     */

  }, {
    key: 'check',
    value: function () {
      var _ref22 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee22(request) {
        return _regenerator2.default.wrap(function _callee22$(_context22) {
          while (1) {
            switch (_context22.prev = _context22.next) {
              case 0:
                return _context22.abrupt('return', this.securityManager.check(request));

              case 1:
              case 'end':
                return _context22.stop();
            }
          }
        }, _callee22, this);
      }));

      function check(_x34) {
        return _ref22.apply(this, arguments);
      }

      return check;
    }()
  }, {
    key: 'checkArgs',
    value: function () {
      var _ref23 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee23(realmId, principalId, action, resource, context) {
        var realm, principal, request;
        return _regenerator2.default.wrap(function _callee23$(_context23) {
          while (1) {
            switch (_context23.prev = _context23.next) {
              case 0:
                assert(realmId, 'realmId not specified');
                assert(principalId, 'principalId not specified');
                assert(action, 'action not specified');
                assert(resource, 'resource not specified');
                assert(context, 'context not specified');
                _context23.next = 7;
                return this.repositoryLocator.realmRepository.findById(realmId);

              case 7:
                realm = _context23.sent;
                _context23.next = 10;
                return this.repositoryLocator.principalRepository.findById(principalId);

              case 10:
                principal = _context23.sent;

                if (!(principal.realm().id !== realm.id)) {
                  _context23.next = 13;
                  break;
                }

                throw new _auth_error.AuthorizationError('principal-realm does not match.');

              case 13:
                request = new _security_access_request.SecurityAccessRequest(realm.realmName, principal.principalName, action, resource, context);
                return _context23.abrupt('return', this.securityManager.check(request));

              case 15:
              case 'end':
                return _context23.stop();
            }
          }
        }, _callee23, this);
      }));

      function checkArgs(_x35, _x36, _x37, _x38, _x39) {
        return _ref23.apply(this, arguments);
      }

      return checkArgs;
    }()
  }, {
    key: 'process',
    value: function () {
      var _ref24 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee24(options) {
        var realm, realms, removed, role, roles, claim, claims, principal, principals;
        return _regenerator2.default.wrap(function _callee24$(_context24) {
          while (1) {
            switch (_context24.prev = _context24.next) {
              case 0:
                _context24.t0 = options.method;
                _context24.next = _context24.t0 === 'addRealm' ? 3 : _context24.t0 === 'showRealms' ? 8 : _context24.t0 === 'removeRealm' ? 14 : _context24.t0 === 'addRole' ? 19 : _context24.t0 === 'showRoles' ? 24 : _context24.t0 === 'removeRole' ? 30 : _context24.t0 === 'addClaim' ? 34 : _context24.t0 === 'showClaims' ? 39 : _context24.t0 === 'removeClaim' ? 45 : _context24.t0 === 'addPrincipal' ? 49 : _context24.t0 === 'showPrincipals' ? 54 : _context24.t0 === 'removePrincipal' ? 60 : 64;
                break;

              case 3:
                _context24.next = 5;
                return this.addRealmArgs(options.realmName);

              case 5:
                realm = _context24.sent;

                console.log('Added realm ' + realm);
                return _context24.abrupt('break', 66);

              case 8:
                _context24.next = 10;
                return this.getRealms();

              case 10:
                realms = _context24.sent;

                console.log('Realms: ');
                realms.forEach(function (realm) {
                  console.log('\t' + realm);
                });
                return _context24.abrupt('break', 66);

              case 14:
                _context24.next = 16;
                return this.removeRealm(options.realmId);

              case 16:
                removed = _context24.sent;

                console.log('Removed realm ' + options.realmId);
                return _context24.abrupt('break', 66);

              case 19:
                _context24.next = 21;
                return this.addRoleArgs(options.realmId, options.roleName, options.claimId, options.roleId);

              case 21:
                role = _context24.sent;

                console.log('Added role ' + role);
                return _context24.abrupt('break', 66);

              case 24:
                _context24.next = 26;
                return this.getRoles(options.realmId);

              case 26:
                roles = _context24.sent;

                console.log('Roles for ' + options.realmId + ': ' + roles.length);
                roles.forEach(function (role) {
                  console.log('\t' + role);
                });
                return _context24.abrupt('break', 66);

              case 30:
                _context24.next = 32;
                return this.removeRole(options.roleId);

              case 32:
                console.log('Removed role ' + options.roleId);
                return _context24.abrupt('break', 66);

              case 34:
                _context24.next = 36;
                return this.addClaimArgs(options.realmId, options.action, options.resource, options.condition);

              case 36:
                claim = _context24.sent;

                console.log('Added claim ' + claim);
                return _context24.abrupt('break', 66);

              case 39:
                _context24.next = 41;
                return this.getClaims(options.realmId);

              case 41:
                claims = _context24.sent;

                console.log('Claims: ');
                claims.forEach(function (claim) {
                  console.log('\t' + claim);
                });
                return _context24.abrupt('break', 66);

              case 45:
                _context24.next = 47;
                return this.removeClaim(options.claimId);

              case 47:
                console.log('Removed claim ' + options.claimId);
                return _context24.abrupt('break', 66);

              case 49:
                _context24.next = 51;
                return this.addPrincipalArgs(options.realmId, options.principalName, options.claimId, options.roleId);

              case 51:
                principal = _context24.sent;

                console.log('Added principal ' + principal);
                return _context24.abrupt('break', 66);

              case 54:
                _context24.next = 56;
                return this.getPrincipals(options.realmId);

              case 56:
                principals = _context24.sent;

                console.log('Principals for ' + options.realmId + ': ');
                principals.forEach(function (principal) {
                  console.log('\t' + principal);
                });
                return _context24.abrupt('break', 66);

              case 60:
                _context24.next = 62;
                return this.removePrincipal(options.principalId);

              case 62:
                console.log('Removed principa ' + options.principalId);
                return _context24.abrupt('break', 66);

              case 64:
                console.log("invalid options");
                console.log(usage);

              case 66:
                return _context24.abrupt('return', true);

              case 67:
              case 'end':
                return _context24.stop();
            }
          }
        }, _callee24, this);
      }));

      function process(_x40) {
        return _ref24.apply(this, arguments);
      }

      return process;
    }()
  }]);
  return RbacCli;
}();

var usage = getUsage(sections);
if (!options.method || !options.dbPath) {
  console.log(usage);
} else {
  var cli = new RbacCli(options.dbPath);
  cli.process(options).then(function (_) {
    process.exit(0);
  });
}

