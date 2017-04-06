/*@flow*/

import type {SecurityCache}    from './interface';

/**
 * Default implementation of SecurityCache 
 */
export class DefaultSecurityCache implements SecurityCache {
    cache: WeakMap<string, any>;

    constructor() {
        this.cache = new WeakMap();
    }


    /**
     * This method returns cache value
     * 
     * @param {*} scope - scope for value
     * @param {*} key - key for the value
     * @return - cache value
     */
    get<T>(scope: string, key: string): ?T {
        return this.cache.get(scope + key);
    }

    /**
     * This method returns cache value or will load value
     * 
     * @param {*} scope - scope for value
     * @param {*} key - key for the value
     * @param {*} dataLoader - is called if value is not present
     * @return - cache value
     */
    getOrLoad<T>(scope: string, key: string, dataLoader: (string) => ?T): ?T {
        let value = this.cache.get(scope + key);
        if (!value) {
            value = dataLoader(key);
            if (value) {
                this.cache.set(scope + key, value);
            }
        }
        return value;
    }

    /**
     * This method adds value to cache 
     * 
     * @param {*} scope - scope for value
     * @param {*} key - key for the value
     * @param {*} value 
     */
    set<T>(scope: string, key: string, value: T) {
        this.cache.set(scope + key, value);
    }

    /**
     * This method removes cache value
     * 
     * @param {*} scope - scope for value
     * @param {*} key - key for the value
     */
    remove(scope: string, key: string): void {
        this.cache.delete(scope + key);
    }
}
