import {IOutputLocation, IRouter} from '../types';

type CacheValue = boolean;

/**
 * Used to manipulate the router cache
 * Cache is set when a router 'hides'
 * Depending on the router type logic, a router can use its
 * cache when setting new state instead of a default value
 */
class Cache {
    private _cacheStore?: CacheValue;

    constructor() {
        this._cacheStore = undefined;
    }

    get hasCache() {
        return !!this._cacheStore;
    }

    get state() {
        return this._cacheStore;
    }

    public removeCache() {
        this._cacheStore = undefined;
    }

    public setCacheFromLocation(location: IOutputLocation, routerInstance: IRouter) {
        // dont set cache if one already exists!
        if (this.hasCache) {
            return;
        }

        let cache;
        if (routerInstance.isPathRouter) {
            cache = !!location.pathname[routerInstance.pathLocation];
        } else {
            cache = !!location.search[routerInstance.routeKey];
        }

        this.setCache(cache);
    }

    protected setCache(value: CacheValue) {
        this._cacheStore = value;
    }
}

export default Cache;
