import RouterBase from '../router/base';
import Manager from '../manager';

// Options are for a specific router within an update cycle
// Context is for all routers within an update cycle

/**
 * Location types
 */
export interface IInputSearch {
    [key: string]: any;
}

export interface IOutputSearch {
    [key: string]: string | string[] | undefined;
}

export interface ILocationOptions {
    data?: string;
    disableCaching?: boolean; // the setting will only persist for the router
    replaceLocation?: boolean; // used to replace history location in URL
}

type Pathname = string[];

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
    disableCaching?: boolean; // the setting will persist for all routers in the update cycle
    addingDefaults?: boolean;
    inverseActivation?: boolean;
    activatedByChildType?: string;
}

/**
 * Router template types
 */
export interface IRouter extends RouterBase {
    show: RouterAction;
    hide: RouterAction;
    reducer: RouterReducer;
}

// at the moment these should be the same
export type IRouterActionOptions = ILocationOptions;

export type RouterAction = (
    options?: IRouterActionOptions,
    location?: IInputLocation,
    router?: IRouter,
    ctx?: ILocationActionContext
) => IInputLocation;

export type RouterReducer = (
    location: IInputLocation,
    router: IRouter,
    ctx: { [key: string]: any }
) => { [key: string]: any };

export interface IRouterTemplateConfig {
    canBePathRouter?: boolean;
    isPathRouter?: boolean;
    shouldInverselyActivate?: boolean;
    disableCaching?: boolean;
}

export interface IRouterTemplate {
    actions: { [actionName: string]: RouterAction };
    reducer: RouterReducer;
    config: IRouterTemplateConfig;
}
/**
 * Router state types
 */
export interface IRouterCurrentState {
    visible?: boolean;
    data?: string;
}

export type RouterHistoryState = IRouterCurrentState[];

export interface IRouterState {
    current: IRouterCurrentState;
    historical: RouterHistoryState;
}

/**
 * Router declaration object
 */

export interface IRouterDeclaration {
    name: string;
    routers?: { [key: string]: IRouterDeclaration[] };
    routeKey?: string;
    type?: string;
    parentName?: string;

    isPathRouter?: boolean;
    shouldInverselyActivate?: boolean;
    disableCaching?: boolean;
    defaultAction?: string[]; // (fn, ...args)
}

/**
 * Serialization options - for spitting out a json representation of the router tree
 */

export interface ISerializeOptions {
    showDefaults?: boolean; // shows default options
    showType?: boolean; // shows the type even when it can be inferred from the parent type
    alwaysShowRouteKey?: boolean; // shows the route key even when its not different from the router name
    showParentName?: boolean;
}

/**
 * Arguments passed into a router constructor (by a manager) to initialize a router
 */
export interface IRouterInitArgs {
    name: string;
    type: string;
    manager: Manager;
    config: IRouterConfig;
    parent?: IRouter;
    routers: IChildRouters;
    root?: IRouter;
    getState?: () => IRouterState | undefined;
    subscribe?: (observer: Observer) => void;
    actions: string[]; // the router actions derived from the template. Usually 'show' and 'hide'
}

export interface IChildRouters {
    [key: string]: IRouter[];
}

export type Observer = (state: IRouterState) => any;

/**
 * Passed into the create router fn
 * The minimal amount of information an instantiated manager needs
 * to create the router init args and initialize a new router
 */
export interface IRouterCreationInfo {
    name: string;
    config: IRouterConfig;
    type: string;
    parentName?: string;
}

/**
 * Computed from the template default config and router declaration
 */
export interface IRouterConfig {
    routeKey: string;

    isPathRouter: boolean;
    shouldInverselyActivate: boolean;
    disableCaching?: boolean; // optional b/c the default is to use the parents
    defaultAction: string[];
}
