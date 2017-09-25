/*@flow*/

import type {IPrincipal, IClaim, IRole, IRealm, ILimit} from './interface';
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

    limits:    UniqueArray<ILimit>;
    /**
     * set of roles
     */
    roles:          UniqueArray<IRole>;

    properties: Map<string, any>;

    constructor(theRealm: IRealm,
                thePrincipalName: string,
                theProps: ?Map<string, any>) {
        //
        assert(theRealm, 'realm is required');
        assert(thePrincipalName, 'principal is required');
        assert(theRealm.id, 'realm-id not specified');

        //
        (this: any)[_realm] = theRealm;
        this.principalName  = thePrincipalName;
        this.claims         = new UniqueArray();
        this.roles          = new UniqueArray();
        this.limits    = new UniqueArray();
        this.properties     = theProps || new Map();
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
