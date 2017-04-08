
/* @flow Interface file */

/**
 * Realm represents domain of application, each application will have a unique
 * realm.
 */
export interface Realm {
    id:         number;  // unique database id

    realmName:  string;  // realm-name
}

/**
 * A role represents job title or function. The role is inheritable so that you can define common
 * and specialized roles
 */
export interface Role {
    id:         number;         // unique database id

    realm:      Realm;          // realm for the application

    roleName:   string;         // role-name 

    parents:    Set<Role>;      // set of claims

    claims:     Set<Claim>;     // set of claims
}

/**
 * A principal represents users or groups who are defined in an application.
 * A principal can have many claims (or permissions) or many roles (role-based)
 */
export interface Principal {
    /**
     * Unique database id
     */
    id:             number;

    /**
     * realm for the application
     */
    realm:          Realm;

    /**
     * principal name such as username
     */
    principalName: string;

    /**
     * set of claims
     */
    claims:         Set<Claim>;

    /**
     * set of roles
     */
    roles:          Set<Role>;

    allClaims():    Set<Claim>; 
}

/**
 * Claim encapsulates access to a resource. The action defines operations that can be acted
 * and resource defines target object that will be acted upon. The condition defines dynamic data
 * when this claim will be granted.
 */
export interface Claim {
    /**
     * Unique database id
     */
    id:         number;
    
    /**
     * realm for the application
     */
    realm:      Realm;

    /**
     * This can be a single operation or regex based multiple operations
     */
    action:     string;

    /**
     * target resource
     */
    resource:   string;

    /**
     * This is optional for specifying runtime condition
     */
    condition:  string;

    /**
     * This method checks if given action and resource matches internal action and action.
     * It tries to compare action and resource directly or using regex 
     * 
     * @param {*} action - action to perform
     * @param {*} resource - target resource that will be acted upon
     */
    implies(action: string, resource: string): boolean;

    /**
     * This method returns true if condition is valid expression
     */
    hasCondition(): boolean;
}
