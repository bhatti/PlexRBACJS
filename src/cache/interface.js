
/* @flow Interface file */

/**
 * SecurityCache - provides interface to cache security data
 */
export interface SecurityCache {
    /**
     * This method returns cache value
     * 
     * @param {*} scope - scope for value
     * @param {*} key - key for the value
     * @return - cache value
     */
    get<T>(scope: string, key: string): ?T;

    /**
     * This method returns cache value and loads if not available
     * 
     * @param {*} scope - scope for value
     * @param {*} key - key for the value
     * @param {*} dataLoader - is called if value is not present
     * @return - cache value
     */
    getOrLoad<T>(scope: string, key: string, dataLoader: (string) => ?T): ?T;

    /**
     * This method adds value to cache 
     * 
     * @param {*} scope - scope for value
     * @param {*} key - key for the value
     * @param {*} value 
     */
    set<T>(scope: string, key: string, value: T): void;

    /**
     * This method removes cache value
     * 
     * @param {*} scope - scope for value
     * @param {*} key - key for the value
     */
    remove(scope: string, key: string): void;
}
