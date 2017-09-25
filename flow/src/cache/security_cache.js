/*@flow*/

import type {SecurityCache}    from './interface';
const assert = require('assert');


/**
 * Default implementation of SecurityCache 
 */
export class DefaultSecurityCache implements SecurityCache {
    cache: Map<string, any>;

    constructor() {
        this.cache = new Map(); // TODO add LRU and eviction
    }


    /**
     * This method returns cache value
     * 
     * @param {*} scope - scope for value
     * @param {*} key - key for the value
     * @return - cache value
     */
    get<T>(scope: string, key: string): ?T {
        assert(scope.length > 0, 'scope not defined');
        assert(key.length > 0, 'key not defined');
        return this.cache.get(this.__toKey(scope, key));
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
        assert(scope.length > 0, 'scope not defined');
        assert(key.length > 0, 'key not defined');
        let value = this.cache.get(scope + key);
        if (!value) {
            value = dataLoader(key);
            if (value) {
                this.cache.set(this.__toKey(scope, key), value);
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
        assert(scope.length > 0, 'scope not defined');
        assert(key.length > 0, 'key not defined');
        assert(value, 'value not defined');
        this.cache.set(this.__toKey(scope, key), value);
    }

    /**
     * This method removes cache value
     * 
     * @param {*} scope - scope for value
     * @param {*} key - key for the value
     */
    remove(scope: string, key: string): void {
        this.cache.delete(this.__toKey(scope, key));
    }

    /**
     * This method clears all cache
     */
    clear() {
        this.cache.clear();
    }

    __toKey(scope: string, key: string): string {
        return `${scope}:${key}`;
    }
}
