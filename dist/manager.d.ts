import { NativeSerializedStore, BrowserSerializedStore } from './serializedState';
import DefaultRouterStateStore from './routerState';
import DefaultRouter from './router/base';
import { IRouterDeclaration, IRouter as RouterT, IRouterInitParams, IRouterConfig, Observer } from './types';
import Router from './router/base';
interface IInit {
    routerTree?: IRouterDeclaration;
    serializedStateStore?: NativeSerializedStore | BrowserSerializedStore;
    routerStateStore?: DefaultRouterStateStore;
    router?: typeof DefaultRouter;
}
interface IRouterInitArgs {
    name: string;
    config: IRouterConfig;
    type: string;
    parent?: Router;
    routers: {
        [type: string]: [Router];
    };
    manager: Manager;
    root?: Router;
    getState?: () => any;
    subscribe?: (observer: Observer) => any;
}
export default class Manager {
    private static setChildrenDefaults;
    private static setCacheAndHide;
    private static createActionWrapperFunction;
    routers: {
        [routerName: string]: RouterT;
    };
    rootRouter: RouterT;
    serializedStateStore: IInit['serializedStateStore'];
    routerStateStore: IInit['routerStateStore'];
    private routerTypes;
    constructor({ routerTree, serializedStateStore, routerStateStore, router }?: IInit);
    addRouters(router?: IRouterDeclaration, type?: string, parentName?: string): void;
    addRouter({ name, routeKey, disableCaching, defaultShow, type, parentName }: IRouterDeclaration): void;
    removeRouter(name: string): void;
    protected validateRouterDeclaration(name: string, type: string, config: IRouterConfig): void;
    protected createNewRouterInitArgs({ name, config, type, parentName }: IRouterInitParams): IRouterInitArgs;
    private createRouterFromInitArgs;
    private createRouter;
    private setNewRouterState;
    private calcNewRouterState;
}
export {};
