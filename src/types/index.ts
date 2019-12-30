import RouterBase from '../router/base';
import Manager from '../manager';
import {NativeSerializedStore, BrowserSerializedStore} from '../serializedState';
import DefaultRoutersStateStore from '../routerState';

export type Constructable<T = {}> = new (...args: any[]) => T; // eslint-disable-line

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
    // inverseActivation?: boolean;
    callDirection?: 'up' | 'down' | undefined;
    activatedByChildType?: string;
}

/**
 * Router template types
 */
// export type = Constructable<RouterBase>
// export interface IRouter<
//     RActions extends Record<string, RouterAction>,
//     RouterCurrentState extends {}
// > extends RouterBase {
//     // constructor: RouterBase['constructor'];
//     // new(...args: RouterBase['constructor'])
//     // show: RouterAction;
//     // hide: RouterAction;
//     [actionName in keyof RActions]: RActions[actionName];
//     reducer: RouterReducer<RouterCurrentState>;
// }

/**
 * Template properties added to the base router class via mixins
 */
export type Actions<ActionNames extends string = string> = {
    [actionName in ActionNames]: RouterActionFn;
} & {show: RouterActionFn; hide: RouterActionFn};

export type Reducer<CurrentState> = {
    reducer: RouterReducerFn<CurrentState>;
};

type a = Actions<'hello' | 'goodbye'>;

export type RouterClass<
    CustomState extends {},
    ActionNames extends string = string,
    RActions extends Actions<ActionNames> = Actions<ActionNames>
> = RActions & Reducer<RouterCurrentState<CustomState>> & typeof RouterBase;
// // & {
//         new (...args: any): any; // eslint-disable-line
//     };
//  extends RouterBase {
//     // constructor: RouterBase['constructor'];
//     // new(...args: RouterBase['constructor'])
//     // show: RouterAction;
//     // hide: RouterAction;
//     [actionName in keyof RActions]: RActions[actionName];
//     reducer: RouterReducer<RouterCurrentState>;
// }

// export type RouterTest<
//     R extends RouterBase,
//     T extends IRouterTemplate = IRouterTemplate,
//     Actions = T['actions'],
//     ActionName extends string = Extract<keyof Actions, string> //keyof T['actions'] = keyof T['actions']
// > = {
//     // [action: ActionName]: Actions[ActionName];
//     reducer: T['reducer'];
// } & R;

// export type RouterTestt<R extends RouterBase, T extends IRouterTemplate> = R & {
//     [actionName: keyof T['actions']]: T['actions'][action];
// } & {reducer: T['reducer']};

// at the moment these should be the same
export type IRouterActionOptions = ILocationOptions;

export type RouterActionFn = (
    options?: IRouterActionOptions,
    location?: IInputLocation,
    router?: InstanceType<RouterClass>,
    ctx?: ILocationActionContext
) => IInputLocation;

export type RouterReducerFn<CustomState extends {} = {}> = (
    location: IInputLocation,
    router: InstanceType<RouterClass>,
    ctx: {[key: string]: any}
) => {[key: string]: RouterCurrentState<CustomState>};

export interface IRouterTemplateConfig {
    canBePathRouter?: boolean;
    isPathRouter?: boolean;
    shouldInverselyActivate?: boolean;
    disableCaching?: boolean;
}

export interface IRouterTemplate<CustomState extends {} = {}, ActionNames extends string = string> {
    actions: Actions<ActionNames>;
    reducer: RouterReducerFn<RouterCurrentState<CustomState>>;
    config: IRouterTemplateConfig;
}
/**
 * Router state types
 */
export type RouterCurrentState<CustomState extends {} = {}> = CustomState & {
    visible?: boolean;
    data?: string;
};

export type RouterHistoricalState<CustomState extends {} = {}> = RouterCurrentState<CustomState>[];

export interface IRouterCurrentAndHistoricalState<CustomState extends {} = {}> {
    current: RouterCurrentState<CustomState>;
    historical: RouterHistoricalState<CustomState>;
}

/**
 * Router declaration object
 */

export interface IRouterDeclaration<RouterType> {
    name: string;
    routers?: {[key: string]: IRouterDeclaration<RouterType>[]};
    routeKey?: string;
    type?: RouterType;
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
export interface IRouterInitArgs<
    RouterType,
    ParentRouter extends RouterClass,
    RootRouter extends RouterClass
> {
    name: string;
    type: RouterType;
    manager: Manager;
    config: IRouterConfig;
    parent?: ParentRouter;
    routers: IChildRouters;
    root?: RootRouter;
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
export interface IRouterCreationInfo<RouterType> {
    name: string;
    config: IRouterConfig;
    type: RouterType;
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

export type ActionWraperFn = (
    options: IRouterActionOptions,
    existingLocation: IOutputLocation,
    routerInstance: IRouter,
    ctx: ILocationActionContext
) => void;

export type ActionWraperFnDecorator = (fn: ActionWraperFn) => ActionWraperFn;

export interface IRouterTemplates<RouterCurrentState extends {}> {
    [templateName: string]: IRouterTemplate<RouterCurrentState>;
}
export interface IManagerInit<CustomTemplates = {}, DefaultTemplates = {}> {
    routerTree?: IRouterDeclaration;
    serializedStateStore?: NativeSerializedStore | BrowserSerializedStore;
    routerStateStore?: DefaultRoutersStateStore;
    router?: typeof RouterBase;
    customTemplates?: CustomTemplates;
    defaultTemplates?: DefaultTemplates;
}
