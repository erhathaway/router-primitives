import Cache from './cache';
import { IRouterState, IRouter, IRouterConfig, IRouterCurrentState, RouterHistoryState, Observer, IRouterDeclaration, ISerializeOptions } from '../types';
interface IChildRouters {
    [key: string]: IRouter[];
}
interface InitParams {
    name: string;
    type: string;
    manager: any;
    config: IRouterConfig;
    parent?: IRouter;
    routers: IChildRouters;
    root: IRouter;
    getState: () => IRouterState;
    subscribe: (observer: Observer) => void;
    actions: string[];
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
    cache: Cache;
    constructor(init: InitParams);
    readonly routeKey: string;
    readonly siblings: IRouter[];
    getNeighborsByType(type: string): IRouter[];
    readonly pathLocation: number;
    readonly isRootRouter: boolean;
    serialize(options?: ISerializeOptions): IRouterDeclaration & {
        [key: string]: any;
    };
    private _addChildRouter;
    readonly isPathRouter: boolean;
    readonly state: IRouterCurrentState;
    readonly history: RouterHistoryState;
}
export {};
