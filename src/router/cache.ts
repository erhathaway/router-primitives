import {IOutputLocation, IRouterTemplates, RouterInstance, NarrowRouterTypeName} from '../types';
import {IRouterCache} from '../types/router_cache';

type CacheValue = boolean | undefined;

/**
 * A store for a routers previous visibliity state.
 * The cache is set when a router 'hides'.
 * Depending on the router type logic, a router can use its
 * cache when setting new state instead of a default value.
 * This is how things like rehydration of a routers state when a parent becomes visible occurs.
 */
class Cache<
    Templates extends IRouterTemplates,
    RouterTypeName extends NarrowRouterTypeName<keyof Templates>
> implements IRouterCache<Templates, RouterTypeName> {
    public _cacheStore?: CacheValue;

    constructor() {
        this._cacheStore = undefined;
    }

    /**
     * The last time a parent was visible, was this router also visible?
     */
    get wasVisible(): boolean {
        return this._cacheStore;
    }

    /**
     * Remove the cached visiblity state.
     */
    public removeCache(): void {
        this._cacheStore = undefined;
    }

    public setWasPreviouslyVisibleToFromLocation(
        location: IOutputLocation,
        routerInstance: RouterInstance<Templates, RouterTypeName>
    ): void {
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

    /**
     * Cached visiblity state setter.
     */
    public setWasPreviouslyVisibleTo(value: CacheValue): void {
        this._cacheStore = value;
    }
}

export default Cache;
