import {IRouterTemplates, NarrowRouterTypeName} from '../types';
import {IRouterCache, CacheState} from '../types/router_cache';

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
    public _cacheStore?: CacheState;

    constructor() {
        this._cacheStore = undefined;
    }

    /**
     * The last time a parent was visible, was this router also visible?
     */
    get wasVisible(): boolean {
        return this._cacheStore && this._cacheStore.visible;
    }

    get previousData(): string | undefined {
        return this._cacheStore && this._cacheStore.data ? this._cacheStore.data : undefined;
    }

    /**
     * Remove the cached visiblity state.
     */
    public removeCache(): void {
        this._cacheStore = undefined;
    }

    public setCache(cache: CacheState): void {
        this._cacheStore = {...this._cacheStore, ...cache};
    }
}

export default Cache;
