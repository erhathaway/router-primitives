import {IOutputLocation, IRouter} from '../types';

type CacheValue = boolean | undefined;

/**
 * Used to manipulate the router cache
 * Cache is set when a router 'hides'
 * Depending on the router type logic, a router can use its
 * cache when setting new state instead of a default value
 */
class Cache {
    public _cacheStore?: CacheValue;

    constructor() {
        this._cacheStore = undefined;
    }

    get wasVisible() {
        return this._cacheStore;
    }

    public removeCache() {
        this._cacheStore = undefined;
    }

    public setWasPreviouslyVisibleToFromLocation(
        location: IOutputLocation,
        routerInstance: IRouter
    ) {
        // dont set cache if one already exists!
        if (this.wasVisible) {
            return;
        }

        let cache: CacheValue;
        if (routerInstance.isPathRouter) {
            cache = !!location.pathname[routerInstance.pathLocation];
        } else {
            cache = !!location.search[routerInstance.routeKey];
        }

        this.setWasPreviouslyVisibleTo(cache);
    }

    public setWasPreviouslyVisibleTo(value: CacheValue) {
        this._cacheStore = value;
    }
}

export default Cache;
