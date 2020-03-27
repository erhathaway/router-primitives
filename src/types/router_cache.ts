// export type CacheState = {
//     visible: boolean;
//     data?: string;
// };

import {
    RouterCurrentState,
    ExtractCustomStateFromTemplate,
    RouterTemplateUnion,
    AllTemplates
} from './index';

/**
 * A store for a routers previous visibliity state.
 * The cache is set when a router 'hides'.
 * Depending on the router type logic, a router can use its
 * cache when setting new state instead of a default value.
 * This is how things like rehydration of a routers state when a parent becomes visible occurs.
 */
export interface IRouterCache<CustomState> {
    cache: Record<string, RouterCurrentState<CustomState>>;
    transactionCache: Record<string, RouterCurrentState<CustomState>>;
    isTransactionRunning: boolean;

    startTransaction: () => void;

    saveTransaction: () => void;

    discardTransaction: () => void;
    /**
     * The last time a parent was visible, was this router also visible?
     */
    wasVisible: (routerName: string) => boolean | undefined;

    previousData: (routerName: string) => CustomState | undefined;

    /**
     * Remove the cached visiblity state.
     */
    removeCache: (routerName: string) => void;

    setCache: (routerName: string, cache: RouterCurrentState<CustomState>) => void;

    serializedCache: string;

    setCacheFromSerialized: (serializedCache: string) => void;
}

type RouterCacheTestAllTemplates = IRouterCache<
    ExtractCustomStateFromTemplate<RouterTemplateUnion<AllTemplates<{}>>>
>;
