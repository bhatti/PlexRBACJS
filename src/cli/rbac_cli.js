'use strict' 

/* @flow Interface file */

const assert          = require('assert');
const commandLineArgs = require('command-line-args');
const getUsage        = require('command-line-usage')

import type {IPrincipal}            from '../domain/interface';
import type {IClaim}                from '../domain/interface';
import type {IRealm}                from '../domain/interface';
import type {IRole}                 from '../domain/interface';
import type {ClaimRepository}       from '../repository/interface';
import type {PrincipalRepository}   from '../repository/interface';
import type {RealmRepository}       from '../repository/interface';
import type {RoleRepository}        from '../repository/interface';
import type {ClaimEffects}          from '../domain/interface';
import {Claim}                      from '../domain/claim';
import {Realm}                      from '../domain/realm';
import {Principal}                  from '../domain/principal';
import {Role}                       from '../domain/role';
import {PersistenceError}           from '../repository/persistence_error';
import {AuthorizationError}         from '../domain/auth_error';
import {RepositoryLocator}          from '../repository/repository_locator';
import {SecurityAccessRequest}      from '../domain/security_access_request';
import {SecurityManager}            from '../manager/security_manager';
import {ConditionEvaluator}         from '../expr/expr_evaluator';

const optionDefinitions = [
  { name: 'dbPath', alias: 'd', type: String},
  { name: 'method', alias: 'm', type: String},
  { name: 'realmName', type: String},
  { name: 'roleName', type: String},
  { name: 'principalName', type: String},
  { name: 'action', type: String},
  { name: 'resource', type: String},
  { name: 'condition', type: String},
  { name: 'realmId', type: Number},
  { name: 'roleId', type: Number},
  { name: 'principalId', type: Number},
  { name: 'variable', type: String, multiple: true},
  { name: 'claimId', type: String, multiple: true }
];

const sections = [
  {
    header: 'rbac_cli',
    content: 'Command line interface for managing roles/claims/principals'
  },
  {
    header: 'Options',
    optionList: [
		{
		name: 'method',
		typeLabel: '[addRealm|showRealms|removeRealm|addRole|showRoles|removeRole|addClaim|showClaims|removeClaim|addPrincipal|showPrincipals|removePrincipal|check]',
		descripton: 'method to perform'
		},
		{
		name: 'realmId',
		typeLabel: 'numeric id',
		descripton: 'realm-id'
		},
		{
		name: 'principalId',
		typeLabel: 'numeric id',
		descripton: 'principal-id'
		},
		{
		name: 'claimId',
		typeLabel: 'numeric id',
		descripton: 'claim-id'
		},
		{
		name: 'realmName',
		typeLabel: 'string',
		descripton: 'realm-name'
		},
		{
		name: 'roleName',
		typeLabel: 'string',
		descripton: 'role-name'
		},
		{
		name: 'principalName',
		typeLabel: 'string',
		descripton: 'principal-name'
		},
		{
		name: 'action',
		typeLabel: 'string',
		descripton: 'action-name for claim'
		},
		{
		name: 'resource',
		typeLabel: 'string',
		descripton: 'resource for claim'
		},
		{
		name: 'condition',
		typeLabel: 'string',
		descripton: 'condition for claim'
		},
		{
		name: 'variable',
		typeLabel: 'string variable=value',
		descripton: 'variable=value'
		},
	]
  }
];

const options = commandLineArgs(optionDefinitions, { partial: true });


export class RbacCli {
	securityManager:   SecurityManager;
    repositoryLocator: RepositoryLocator;

    constructor(dbPath: string) {
	    this.repositoryLocator = new RepositoryLocator('sqlite', dbPath, () => {});
        this.securityManager   = new SecurityManager(new ConditionEvaluator(), this.repositoryLocator);
    }

    /**
     * This method retrieves principal by name
     * @param {*} realmName - domain of application
     * @param {*} principalName - to look
     * @return principal
     */
    async getPrincipalByName(realmName: string, principalName: string): Promise<IPrincipal> {
        return this.repositoryLocator.principalRepository.findByName(realmName, principalName);
    }
    /**
     * This method retrieves principal by id
     * @return principal
     */
    async getPrincipalById(id: number): Promise<IPrincipal> {
        return this.repositoryLocator.principalRepository.findById(id);
    }

    /**
     * This method retrieves principal 
     * @param {*} realmId - domain of application
     * @return array of principals
     */
    async getPrincipals(realmId: number): Promise<Array<IPrincipal>> {
		assert(realmId, 'realmId not specified');
        let criteria    = new Map();
        criteria.set('realm_id', realmId);
        return await this.repositoryLocator.principalRepository.search(criteria);
    }

    /**
     * This method saves principal
     * @param {*} principal - to save
     */
    async addPrincipal(principal: IPrincipal): Promise<IPrincipal> {
        return this.repositoryLocator.principalRepository.save(principal);
    }

    /**
     * This method saves principal
     * @param {*} principal - to save
     */
    async addPrincipalArgs(realmId: number, principalName: string, claimIds: ?Array<number>, roleIds: ?Array<number>): Promise<IPrincipal> {
		assert(realmId, 'realmId not specified');
		assert(principalName, 'principalName not specified');
        let realm       = await this.repositoryLocator.realmRepository.findById(realmId);
        let principal   = new Principal(realm, principalName);
        //
        if (claimIds && claimIds.length > 0) {
            for (var i=0; i<claimIds.length; i++) {
                principal.claims.add(await this.repositoryLocator.claimRepository.findById(claimIds[i]));
            }
        }
        if (roleIds && roleIds.length > 0) {
            for (var i=0; i<roleIds.length; i++) {
                principal.roles.add(await this.repositoryLocator.roleRepository.findById(roleIds[i]));
            }
        }
        return await this.addPrincipal(principal);
    }

    /**
     * This method removes principal
     * @param {*} principal - to remove
     * @return true if successfully removed
     */
    async removePrincipal(principalId: number): Promise<boolean> {
        return this.repositoryLocator.principalRepository.removeById(principalId);
    }

    /**
     * This method adds realm
     * @param {*} realm - realm
     * @return - realm
     */
    async addRealm(realm: IRealm): Promise<IRealm> {
        return this.repositoryLocator.realmRepository.save(realm);
    }
    /**
     * This method removes realm
     * @param {*} id of realm
     * @return true if successfully removed
     */
    async removeRealm(id: number): Promise<boolean> {
        return this.repositoryLocator.realmRepository.removeById(id);
    }


    async addRealmArgs(realmName: string): Promise<IRealm> {
		assert(realmName, 'realmName not specified');
		let realm = new Realm(realmName);
		return await this.repositoryLocator.realmRepository.save(realm);
    }

    /**
     * This method retrieves realm by realm-name
     * @param {*} realmName - realm-name
     * @return - realm
     */
    async getRealm(realmName: string): Promise<IRealm> {
        return this.repositoryLocator.realmRepository.findByName(realmName);
    }

    /**
     * This method retrieves realms
     * @return - array of realms
     */
    async getRealms(): Promise<Array<IRealm>> {
	    let criteria    = new Map();
	    return await this.repositoryLocator.realmRepository.search(criteria);
    }

    /**
     * This method adds role
     * @param {*} role - to save
     * @return - saved role
     */
    async addRole(role: IRole): Promise<IRole> {
        return this.repositoryLocator.roleRepository.save(role);
    }

    /**
     * This method adds role
     * @param {*} role - to save
     * @return - saved role
     */
    async addRoleArgs(realmId: number, roleName: string, claimIds: ?Array<number>, parentIds: ?Array<number>): Promise<IRole> {
		assert(realmId, 'realmId not specified');
		assert(roleName, 'roleName not specified');
        let realm       = await this.repositoryLocator.realmRepository.findById(realmId);
        let role        = new Role(realm, roleName);
        //
        if (claimIds && claimIds.length > 0) {
            for (var i=0; i<claimIds.length; i++) {
                role.claims.add(await this.repositoryLocator.claimRepository.findById(claimIds[i]));
            }
        }
        if (parentIds && parentIds.length > 0) {
            for (var i=0; i<parentIds.length; i++) {
                role.parents.add(await this.repositoryLocator.roleRepository.findById(parentIds[i]));
            }
        }
        return await this.addRole(role);
    }

    /**
     * This method retrieves roles
     * @return - array of roles
     */
    async getRoles(realmId: number): Promise<Array<IRole>> {
		assert(realmId, 'realmId not specified');

        let criteria    = new Map();
        criteria.set('realm_id', realmId);
        return await this.repositoryLocator.roleRepository.search(criteria);
    }

    async getRole(roleId: number): Promise<IRole> {
		assert(roleId, 'roleIdnot specified');

        return await this.repositoryLocator.roleRepository.findById(roleId);
    }

    /**
     * This method remove role
     * @param {*} role - to delete
     * @return true if successfully removed
     */
    async removeRole(role: IRole): Promise<boolean> {
        return this.repositoryLocator.roleRepository.removeById(role.id);
    }

    /**
     * This method adds claim
     * @param {*} claim - to save
     */
    async addClaim(claim: IClaim): Promise<IClaim> {
        return this.repositoryLocator.claimRepository.save(claim);
    }

    async addClaimArgs(realmId: number, action: string, resource: string, condition: ?string, effect: ?ClaimEffects): Promise<IClaim> {
		assert(realmId, 'realmId not specified');
		assert(action, 'action not specified');
		assert(resource, 'resource not specified');

		let realm       = await this.repositoryLocator.realmRepository.findById(realmId);

		let claim   = new Claim(realm, action, resource, condition || '', effect || Claim.allow);
		//
		return this.addClaim(claim); 
	}


    /**
     * This method removes claim
     * @param {*} claim
     * @return true if successfully removed
     */
    async removeClaim(id: number): Promise<boolean> {
        return this.repositoryLocator.claimRepository.removeById(id);
    }

    /**
     * This method returns claims
     * @param {*} realmId
     * @param {*} offset
     * @param {*} max
     * @return list of claims
     */
    async getClaims(realmId: number, offset: ?number, max: ?number): Promise<Array<IClaim>> {
		assert(realmId, 'realmId not specified');
	    let criteria    = new Map();
	    criteria.set('realm_id', realmId);
	    return await this.repositoryLocator.claimRepository.search(criteria);
    }

    /**
     * This method returns a claim by id
     * @param {*} claimId
     * @return list of claims
     */
    async getClaim(claimId: number): Promise<IClaim> {
		assert(claimId, 'claimId not specified');
		return await this.repositoryLocator.claimRepository.findById(claimId);
	}



    /**
     * This method remove set of roles as parent
     */
    async check(request: SecurityAccessRequest): Promise<ClaimEffects> {
        return this.securityManager.check(request);
    }


    async checkArgs(realmId: number, principalId: number, action: string, resource: string, context: Map<string, any>): Promise<ClaimEffects> {
		assert(realmId, 'realmId not specified');
		assert(principalId, 'principalId not specified');
		assert(action, 'action not specified');
		assert(resource, 'resource not specified');
		assert(context, 'context not specified');
	    let realm       = await this.repositoryLocator.realmRepository.findById(realmId);
	    let principal   = await this.repositoryLocator.principalRepository.findById(principalId);
        if (principal.realm().id !== realm.id) {
            throw new AuthorizationError('principal-realm does not match.');
        }
	    let request    = new SecurityAccessRequest(
						realm.realmName,
						principal.principalName,
						action,
						resource,
						context);
        return this.securityManager.check(request);
    }


    async process(options: any): Promise<*> {
		switch (options.method) {
		  case 'addRealm':
			let realm = await this.addRealmArgs(options.realmName);
			console.log(`Added realm ${String(realm)}`);
			break;
		  case 'showRealms':
			let realms = await this.getRealms();
			console.log('Realms: ');
			realms.forEach(realm => {
				console.log(`\t${String(realm)}`);
			});
			break;
		  case 'removeRealm':
			let removed = await this.removeRealm(options.realmId);
			console.log(`Removed realm ${options.realmId}`);
			break;
		  case 'addRole':
			let role = await this.addRoleArgs(options.realmId, options.roleName, options.claimId, options.roleId);
			console.log(`Added role ${String(role)}`);
			break;
		  case 'showRoles':
			let roles = await this.getRoles(options.realmId);
			console.log(`Roles for ${options.realmId}: ${roles.length}`);
			roles.forEach(role => {
				console.log(`\t${String(role)}`);
			});
			break;
		  case 'removeRole':
			await this.removeRole(options.roleId);
			console.log(`Removed role ${options.roleId}`);
			break;
		  case 'addClaim':
			let claim = await this.addClaimArgs(options.realmId, options.action, options.resource, options.condition);
			console.log(`Added claim ${String(claim)}`);
			break;
		  case 'showClaims':
			let claims = await this.getClaims(options.realmId);
			console.log('Claims: ');
			claims.forEach(claim => {
				console.log(`\t${String(claim)}`);
			});
			break;
		  case 'removeClaim':
			await this.removeClaim(options.claimId);
			console.log(`Removed claim ${options.claimId}`);
			break;
		  case 'addPrincipal':
			let principal = await this.addPrincipalArgs(options.realmId, options.principalName, options.claimId, options.roleId);
			console.log(`Added principal ${String(principal)}`);
			break;
		  case 'showPrincipals':
			let principals = await this.getPrincipals(options.realmId);
			console.log(`Principals for ${options.realmId}: `);
			principals.forEach(principal => {
				console.log(`\t${String(principal)}`);
			});
			break;
		  case 'removePrincipal':
			await this.removePrincipal(options.principalId);
			console.log(`Removed principa ${options.principalId}`);
			break;
		  default:
    		console.log("invalid options");
    		console.log(usage);
		}
        return true;
    }
}

const usage = getUsage(sections);
if (!options.method || !options.dbPath) {
    console.log(usage);
} else {
    let cli = new RbacCli(options.dbPath);
    cli.process(options).then(_ => {
        process.exit(0);
    });
}
