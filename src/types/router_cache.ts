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
export interface IRouterCache {
    cache: Record<string, CacheState>;
    transactionCache: Record<string, CacheState>;
    isTransactionRunning: boolean;

    startTransaction: () => void;

    saveTransaction: () => void;

    discardTransaction: () => void;
    /**
     * The last time a parent was visible, was this router also visible?
     */
    wasVisible: (routerName: string) => boolean | undefined;

    previousData: (routerName: string) => string | undefined;

    /**
     * Remove the cached visiblity state.
     */
    removeCache: (routerName: string) => void;

    setCache: (routerName: string, cache: CacheState) => void;

    serializedCache: string;

    setCacheFromSerialized: (serializedCache: string) => void;
}
