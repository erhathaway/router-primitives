import { OutputLocation } from "../types";
declare type CacheValue = string | boolean;
/**
 * Used to manipulate the router cache
 * Cache is set when a router 'hides'
 * Depending on the router type logic, a router can use its
 * cache when setting new state instead of a default value
 */
declare class Cache {
    _cacheStore?: CacheValue;
    constructor();
    readonly hasCache: boolean;
    readonly state: CacheValue;
    removeCache(): void;
    setCache(value: CacheValue): void;
    setCacheFromLocation(location: OutputLocation, routerInstance: any): void;
}
export default Cache;
