import {CacheState, IRouterCache} from './types/router_cache';

/**
 * The default router cache store.
 */
export default class DefaultRouterCacheStore implements IRouterCache {
    public cache: Record<string, CacheState>;
    public transactionCache: Record<string, CacheState>;
    public isTransactionRunning: boolean;

    constructor() {
        this.cache = {};
        this.transactionCache = {};
        this.isTransactionRunning = false;
    }

    public startTransaction = (): void => {
        this.isTransactionRunning = true;
        this.transactionCache = {...this.cache};
    };

    public saveTransaction = (): void => {
        this.cache = {...this.transactionCache};
        this.transactionCache = {};
        this.isTransactionRunning = false;
    };

    public discardTransaction = (): void => {
        this.transactionCache = {};
        this.isTransactionRunning = false;
    };

    /**
     * The last time a parent was visible, was this router also visible?
     */
    wasVisible(routerName: string): boolean | undefined {
        return this.cache[routerName] ? this.cache[routerName].visible === true : undefined;
    }

    previousData(routerName: string): string | undefined {
        return this.cache[routerName] && this.cache[routerName].data
            ? this.cache[routerName].data
            : undefined;
    }

    /**
     * Remove the cached visiblity state.
     */
    public removeCache(routerName: string): void {
        if (this.isTransactionRunning) {
            this.transactionCache[routerName] = undefined;
        } else {
            this.cache[routerName] = undefined;
        }
    }

    public setCache(routerName: string, cache: CacheState): void {
        if (this.isTransactionRunning) {
            this.transactionCache[routerName] = {...this.transactionCache[routerName], ...cache};
        } else {
            this.cache[routerName] = {...this.cache[routerName], ...cache};
        }
    }

    public get serializedCache(): string {
        if (this.isTransactionRunning) {
            return JSON.stringify(this.transactionCache);
        } else {
            return JSON.stringify(this.cache);
        }
    }

    public setCacheFromSerialized(serializedCache: string): void {
        this.cache = JSON.parse(serializedCache);
    }
}
