import { IOutputLocation, IRouter } from "../types";
declare type CacheValue = boolean;
/**
 * Used to manipulate the router cache
 * Cache is set when a router 'hides'
 * Depending on the router type logic, a router can use its
 * cache when setting new state instead of a default value
 */
declare class Cache {
    private _cacheStore?;
    constructor();
    readonly hasCache: boolean;
    readonly state: boolean;
    removeCache(): void;
    setCache(value: CacheValue): void;
    setCacheFromLocation(location: IOutputLocation, routerInstance: IRouter): void;
}
export default Cache;
