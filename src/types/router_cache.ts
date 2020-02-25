import {IOutputLocation, IRouterTemplates, RouterInstance, NarrowRouterTypeName} from '../types';
import {IRouterBase} from './router_base';

export type RouterCacheValue = boolean | undefined;

/**
 * A store for a routers previous visibliity state.
 * The cache is set when a router 'hides'.
 * Depending on the router type logic, a router can use its
 * cache when setting new state instead of a default value.
 * This is how things like rehydration of a routers state when a parent becomes visible occurs.
 */
export interface IRouterCache<
    Templates extends IRouterTemplates,
    RouterTypeName extends NarrowRouterTypeName<keyof Templates>
> {
    _cacheStore?: RouterCacheValue;

    /**
     * The last time a parent was visible, was this router also visible?
     */
    wasVisible: boolean;

    /**
     * Remove the cached visiblity state.
     */
    removeCache: () => void;

    setWasPreviouslyVisibleToFromLocation: (
        location: IOutputLocation,
        routerInstance: IRouterBase<Templates, RouterTypeName>
    ) => void;

    /**
     * Cached visiblity state setter.
     */
    setWasPreviouslyVisibleTo: (value: RouterCacheValue) => void;
}
