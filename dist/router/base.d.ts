import Cache from './cache';
import { RouterState, Router, RouterCurrentState, RouterHistoryState } from '../types';
interface Config {
    routeKey?: string;
    shouldStoreLocationMutationInHistory?: boolean;
    isPathRouter?: boolean;
}
interface ChildRouters {
    [key: string]: Router[];
}
declare type Observer = (state: RouterState) => any;
interface InitParams {
    name: string;
    type: string;
    manager: any;
    config: Config;
    parent: Router;
    routers: ChildRouters;
    root: Router;
    defaultShow?: boolean;
    disableCaching?: boolean;
    getState: () => RouterState;
    subscribe: (observer: Observer) => void;
}
export default class RouterBase {
    name: InitParams['name'];
    config: InitParams['config'];
    type: InitParams['type'];
    manager: InitParams['manager'];
    parent: InitParams['parent'];
    routers: InitParams['routers'];
    root: InitParams['root'];
    getState: InitParams['getState'];
    subscribe: InitParams['subscribe'];
    defaultShow: InitParams['defaultShow'];
    disableCaching: InitParams['disableCaching'];
    cache: Cache;
    constructor(init: InitParams);
    readonly routeKey: string;
    readonly shouldStoreLocationMutationInHistory: boolean;
    readonly siblings: Router[];
    getNeighborsByType(type: string): Router[];
    readonly pathLocation: number;
    readonly isRootRouter: boolean;
    _addChildRouter(router: Router): void;
    readonly isPathRouter: boolean;
    readonly state: RouterCurrentState;
    readonly history: RouterHistoryState;
    calcCachedLocation(globalState?: any): {
        isPathData: boolean;
        pathLocation: number;
        value: any;
        queryParam?: undefined;
    } | {
        queryParam: string;
        value: any;
        isPathData?: undefined;
        pathLocation?: undefined;
    };
    static joinLocationWithCachedLocation(location: any, cachedLocation: any): any;
}
export {};
