import RouterBase from '../router/base';
import Manager from '../manager';
export interface IInputSearch {
    [key: string]: any;
}
export interface IOutputSearch {
    [key: string]: string | string[] | undefined;
}
export interface ILocationOptions {
    data?: string;
    disableCaching?: boolean;
    replaceLocation?: boolean;
}
declare type Pathname = string[];
export interface IOutputLocation {
    pathname: Pathname;
    search: IOutputSearch;
    options: ILocationOptions;
}
export interface IInputLocation {
    pathname: Pathname;
    search: IInputSearch;
    options: ILocationOptions;
}
export interface ILocationActionContext {
    disableCaching?: boolean;
    addingDefaults?: boolean;
}
export interface IRouter extends RouterBase {
    show: RouterAction;
    hide: RouterAction;
    reducer: RouterReducer;
}
export declare type IRouterActionOptions = ILocationOptions;
export declare type RouterAction = (options?: IRouterActionOptions, location?: IInputLocation, router?: IRouter, ctx?: ILocationActionContext) => IInputLocation;
export declare type RouterReducer = (location: IInputLocation, router: IRouter, ctx: {
    [key: string]: any;
}) => {
    [key: string]: any;
};
export interface IRouterTemplate {
    actions: {
        [actionName: string]: RouterAction;
    };
    reducer: RouterReducer;
}
export interface IRouterCurrentState {
    visible?: boolean;
    data?: string;
}
export declare type RouterHistoryState = IRouterCurrentState[];
export interface IRouterState {
    current: IRouterCurrentState;
    historical: RouterHistoryState;
}
export interface IRouterDeclaration extends IRouterConfig {
    name: string;
    routers?: {
        [key: string]: IRouterDeclaration[];
    };
    routeKey?: string;
    disableCaching?: boolean;
    isPathRouter?: boolean;
    type?: string;
    parentName?: string;
    defaultAction?: string[];
}
export interface ISerializeOptions {
    showDefaults: boolean;
    showType: boolean;
    alwaysShowRouteKey: boolean;
    showParentName: boolean;
}
export interface IRouterConfig {
    routeKey?: string;
    isPathRouter?: boolean;
    disableCaching?: boolean;
    defaultAction?: string[];
}
export declare type Observer = (state: IRouterState) => any;
export interface IRouterInitParams {
    name: string;
    routeKey?: string;
    config: IRouterConfig;
    type?: string;
    parentName?: string;
}
export interface IRouterInitArgs {
    name: string;
    config: IRouterConfig;
    type: string;
    parent?: IRouter;
    routers: {
        [type: string]: [IRouter];
    };
    manager: Manager;
    root?: IRouter;
    getState?: () => any;
    subscribe?: (observer: Observer) => any;
}
export {};
