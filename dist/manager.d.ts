import { NativeSerializedStore, BrowserSerializedStore } from './serializedState';
import DefaultRouterStateStore from './routerState';
import DefaultRouter from './router/base';
import { IRouterDeclaration, IRouter as RouterT, IRouterTemplate, IInputLocation, ILocationActionContext, IRouterInitParams, IRouterConfig, IRouterInitArgs } from './types';
interface IInit {
    routerTree?: IRouterDeclaration;
    serializedStateStore?: NativeSerializedStore | BrowserSerializedStore;
    routerStateStore?: DefaultRouterStateStore;
    router?: typeof DefaultRouter;
    templates?: {
        [templateName: string]: IRouterTemplate;
    };
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
    routerTypes: {
        [routerType: string]: RouterT;
    };
    templates: IInit['templates'];
    constructor({ routerTree, serializedStateStore, routerStateStore, router, templates }?: IInit);
    addRouters(router?: IRouterDeclaration, type?: string, parentName?: string): void;
    addRouter({ name, routeKey, disableCaching, defaultShow, type, parentName, defaultAction }: IRouterDeclaration): void;
    removeRouter(name: string): void;
    calcNewRouterState(location: IInputLocation, router: RouterT, ctx?: ILocationActionContext, newState?: {
        [routerName: string]: {};
    }): {
        [routerName: string]: {};
    };
    protected validateRouterDeclaration(name: string, type: string, config: IRouterConfig): void;
    protected createNewRouterInitArgs({ name, config, type, parentName }: IRouterInitParams): IRouterInitArgs;
    protected createRouterFromInitArgs(initalArgs: ReturnType<Manager['createNewRouterInitArgs']>, routerActionNames: string[]): RouterT;
    protected setNewRouterState(location: IInputLocation): void;
    protected createRouter({ name, config, type, parentName }: IRouterInitParams): RouterT;
}
export {};
