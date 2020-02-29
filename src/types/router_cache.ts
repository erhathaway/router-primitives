import {IRouterTemplates, NarrowRouterTypeName} from '../types';

export type CacheState = {
    visible: boolean;
    data?: string;
};

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
    _cacheStore?: CacheState;

    /**
     * The last time a parent was visible, was this router also visible?
     */
    wasVisible: boolean | undefined;

    previousData: string | undefined;

    /**
     * Remove the cached visiblity state.
     */
    removeCache: () => void;

    setCache: (cache: CacheState) => void;
}
