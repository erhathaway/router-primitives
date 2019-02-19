import RouterBase from "../router/base";
/**
 * Location types
 */
export interface IInputSearch {
    [key: string]: any;
}
export interface IOutputSearch {
    [key: string]: string | string[] | undefined;
}
export interface IOptions {
    replaceLocation?: boolean;
}
declare type Pathname = string[];
export interface IOutputLocation {
    pathname: Pathname;
    search: IOutputSearch;
    options: IOptions;
}
export interface IInputLocation {
    pathname: Pathname;
    search: IInputSearch;
    options: IOptions;
}
export interface ILocationActionContext {
    disableCaching?: boolean;
}
/**
 * Rotuer template types
 */
export interface IRouter extends RouterBase {
    show: RouterAction;
    hide: RouterAction;
    reducer: RouterReducer;
}
export declare type RouterAction = (location?: IInputLocation, router?: IRouter, ctx?: {
    [key: string]: any;
}) => IInputLocation;
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
/**
 * Router state types
 */
export interface IRouterCurrentState {
    visible?: boolean;
}
export declare type RouterHistoryState = IRouterCurrentState[];
export interface IRouterState {
    current: IRouterCurrentState;
    historical: RouterHistoryState;
}
/**
 * Router declaration object
 */
export interface IRouterDeclaration {
    name: string;
    routers?: {
        [key: string]: IRouterDeclaration[];
    };
    routeKey?: string;
    config?: {
        disableCaching?: boolean;
    };
    defaultShow?: boolean;
    type?: string;
    parentName?: string;
}
export {};
