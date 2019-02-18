import RouterBase from "../router/base";
/**
 * Location types
 */
export interface InputSearch {
    [key: string]: any;
}
export interface OutputSearch {
    [key: string]: string | string[] | undefined;
}
export declare type Options = {
    replaceLocation?: boolean;
};
declare type Pathname = string[];
export declare type OutputLocation = {
    pathname: Pathname;
    search: OutputSearch;
    options: Options;
};
export declare type InputLocation = {
    pathname: Pathname;
    search: InputSearch;
    options: Options;
};
export declare type LocationActionContext = {
    disableCaching?: boolean;
};
/**
 * Rotuer template types
 */
export interface Router extends RouterBase {
    show: RouterAction;
    hide: RouterAction;
    reducer: RouterReducer;
}
export declare type RouterAction = (location: InputLocation, router: Router, ctx: {
    [key: string]: any;
}) => InputLocation;
export declare type RouterReducer = (location: InputLocation, router: Router, ctx: {
    [key: string]: any;
}) => {
    [key: string]: any;
};
export declare type RouterTemplate = {
    actions: {
        [actionName: string]: RouterAction;
    };
    reducer: RouterReducer;
};
/**
 * Router state types
 */
export declare type RouterCurrentState = {
    visible?: boolean;
};
export declare type RouterHistoryState = RouterCurrentState[];
export declare type RouterState = {
    current: RouterCurrentState;
    historical: RouterHistoryState;
};
/**
 * Router declaration object
 */
export declare type RouterDeclaration = {
    name: string;
    routers?: {
        [key: string]: RouterDeclaration[];
    };
    routeKey?: string;
    config?: {
        [key: string]: boolean;
    };
    defaultShow?: boolean;
    disableCaching?: boolean;
    type?: string;
    parentName?: string;
};
export {};
