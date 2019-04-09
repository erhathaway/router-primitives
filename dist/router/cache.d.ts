import { IOutputLocation, IRouter } from "../types";
declare type CacheValue = boolean;
declare class Cache {
    private _cacheStore?;
    constructor();
    readonly hasCache: boolean;
    readonly state: boolean;
    removeCache(): void;
    setCacheFromLocation(location: IOutputLocation, routerInstance: IRouter): void;
    protected setCache(value: CacheValue): void;
}
export default Cache;
