import Cache from './cache';
import { IRouterState, IRouter, IRouterCurrentState, RouterHistoryState } from '../types';
interface IConfig {
    routeKey?: string;
    shouldStoreLocationMutationInHistory?: boolean;
    isPathRouter?: boolean;
}
interface IChildRouters {
    [key: string]: IRouter[];
}
declare type Observer = (state: IRouterState) => any;
interface InitParams {
    name: string;
    type: string;
    manager: any;
    config: IConfig;
    parent: IRouter;
    routers: IChildRouters;
    root: IRouter;
    defaultShow?: boolean;
    disableCaching?: boolean;
    getState: () => IRouterState;
    subscribe: (observer: Observer) => void;
}
export default class RouterBase {
    name: InitParams['name'];
    type: InitParams['type'];
    manager: InitParams['manager'];
    parent: InitParams['parent'];
    routers: InitParams['routers'];
    root: InitParams['root'];
    getState: InitParams['getState'];
    subscribe: InitParams['subscribe'];
    config: InitParams['config'];
    defaultShow: InitParams['defaultShow'];
    disableCaching: InitParams['disableCaching'];
    cache: Cache;
    constructor(init: InitParams);
    readonly routeKey: string;
    readonly shouldStoreLocationMutationInHistory: boolean;
    readonly siblings: IRouter[];
    getNeighborsByType(type: string): IRouter[];
    readonly pathLocation: number;
    readonly isRootRouter: boolean;
    private _addChildRouter;
    readonly isPathRouter: boolean;
    readonly state: IRouterCurrentState;
    readonly history: RouterHistoryState;
}
export {};
