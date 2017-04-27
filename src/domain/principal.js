/*@flow*/

import type {IPrincipal, IClaim, IRole, IRealm} from './interface';
import {UniqueArray}                            from '../util/unique_array';
import type {UniqueIdentifier}                  from '../util/unique_id';

const assert = require('assert');

const _realm        = Symbol('realm');

export class Principal implements IPrincipal, UniqueIdentifier {
	/**
	 * unique database id
	 */
	id:             number;

	/**
	 * principal name such as username
	 */
	principalName:  string;

	/**
	 * set of Claims
	 */
	claims:         UniqueArray<IClaim>;

	/**
	 * set of roles
	 */
	roles:          UniqueArray<IRole>;

	constructor(theRealm: IRealm,
				thePrincipalName: string) {
		//
		assert(theRealm, 'realm is required');
		assert(thePrincipalName, 'principal is required');
		//
		(this: any)[_realm] = theRealm;
		this.principalName  = thePrincipalName;
		this.claims         = new UniqueArray();
		this.roles          = new UniqueArray();
	}

	realm(): IRealm {
		return (this: any)[_realm];
	}

	uniqueKey(): string {
		return `${this.realm().realmName}_${this.principalName}`;
	}

	allClaims(): UniqueArray<IClaim> {
		let allClaims: UniqueArray<IClaim> = new UniqueArray();
		this.claims.forEach(claim => {
			allClaims.add(claim);
		});
		this.roles.forEach(role => {
			this.___loadRoleClaims(role, allClaims);
		});
		return allClaims;
	}

	___loadRoleClaims(role: IRole, allClaims: UniqueArray<IClaim>):void {
		role.claims.forEach(claim => {
			allClaims.add(claim);
		});
		role.parents.forEach(parentRole => {
			this.___loadRoleClaims(parentRole, allClaims);
		});
	}

	/**
	 * returns textual representation
	 */
	toString() {
		return `(${this.id}, ${this.principalName}, ${String(this.claims)}, ${String(this.roles)})`;
	}
}
