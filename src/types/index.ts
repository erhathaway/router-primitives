import RouterBase from '../router/base';
import Manager from '../manager';
import {NativeSerializedStore, BrowserSerializedStore} from '../serializedState';
import DefaultRoutersStateStore from '../routerState';
import template from '../router/template';

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
export type Actions<CustomActionNames extends string = string> = CustomActionNames extends string
    ? {
          [actionName in CustomActionNames]: RouterActionFn;
      } & {show: RouterActionFn; hide: RouterActionFn}
    : {show: RouterActionFn; hide: RouterActionFn};

export type Reducer<CurrentState> = {
    reducer: RouterReducerFn<CurrentState>;
};

type actionsTest = Actions<'hello' | 'goodbye'>;
type actionsTestA = Actions<undefined>;

// Parent is an intersection of all router types
// Root is the root router type
// Children are an array of [routerType]: RouterInstanceType

type OneOf<T extends IRouterTemplates> = {[K in keyof T]: Pick<T, K>}[keyof T];

type oneOfTest = OneOf<typeof template>;

export type Parent<T extends IRouterTemplates> = {
    [RouterType in keyof T]: RouterInstance<RouterTypeName<RouterType>, T>;
}[keyof T];

type parentTest = Parent<typeof template>;

export type Root<T extends IRouterTemplates, NameOfRoot extends string = 'root'> = RouterInstance<
    NameOfRoot,
    T
>;

type rootTest = Root<typeof template>;

type RouterTypeName<Names extends string | number | symbol> = Names extends string ? Names : never;

type routerTypeName = RouterTypeName<keyof typeof template>;

type ActionNames<
    Actions extends {},
    ActionNames extends string | number | symbol = keyof Actions
> = ActionNames extends string ? ActionNames : never;

type actionNamesTest = ActionNames<typeof template.root['actions']>;

export type Childs<T extends IRouterTemplates> = {
    [RouterType in Exclude<keyof T, 'root'>]: Array<RouterInstance<RouterTypeName<RouterType>, T>>;
};

type childsTest = Childs<typeof template>;

export type RouterInstance<
    RouterTypeName extends string,
    Templates extends IRouterTemplates,
    CustomRouterBase extends RouterBase<
        Parent<Templates>,
        Root<Templates>,
        RouterTypeName,
        ExtractCustomStateFromTemplate<Templates[RouterTypeName]>,
        Childs<Templates>
    > = RouterBase<
        Parent<Templates>,
        Root<Templates>,
        RouterTypeName,
        ExtractCustomStateFromTemplate<Templates[RouterTypeName]>,
        Childs<Templates>
    >
    // RActions extends Actions<CustonActionNames> = Actions<CustonActionNames>
> = Actions<ExtractCustomActionsFromTemplate<Templates[RouterTypeName]>> &
    Reducer<RouterCurrentState<ExtractCustomStateFromTemplate<Templates[RouterTypeName]>>> &
    CustomRouterBase;

type routerInstanceTest = RouterInstance<'stack', typeof template>;
type routerInstanceTestA = RouterInstance<'scene', typeof template>;

export type RouterClass<
    RouterTypeName extends string,
    Templates extends IRouterTemplates,
    CustomRouterBase extends RouterBase<
        Parent<Templates>,
        Root<Templates>,
        RouterTypeName,
        ExtractCustomStateFromTemplate<Templates[RouterTypeName]>,
        Childs<Templates>
    > = RouterBase<
        Parent<Templates>,
        Root<Templates>,
        RouterTypeName,
        ExtractCustomStateFromTemplate<Templates[RouterTypeName]>,
        Childs<Templates>
    >
> = {
    new (...args: ConstructorParameters<typeof RouterBase & CustomRouterBase>): RouterInstance<
        RouterTypeName,
        Templates,
        CustomRouterBase
    >;
};

class Hello extends RouterBase<null, null, string> {}

type f = InstanceType<RouterClass<'stack', typeof template, Hello>>;

// type GetConstructorArgs<T> = T extends new (...args: infer U) => any ? U : never

// type e = ConstructorParameters<typeof RouterBase>
// RActions & Reducer<RouterCurrentState<CustomState>> & RouterBase;
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
) => RouterCurrentState<CustomState>;

export interface IRouterTemplateConfig {
    canBePathRouter?: boolean;
    isPathRouter?: boolean;
    shouldInverselyActivate?: boolean;
    disableCaching?: boolean;
}

export interface IRouterTemplate<
    CustomState extends {} = {},
    CustomActionNames extends string = string
> {
    actions: Actions<CustomActionNames>;
    reducer: RouterReducerFn<RouterCurrentState<CustomState>>;
    config: IRouterTemplateConfig;
}

type iRouterTemplateTest = IRouterTemplate<{hello: true}, 'big' | 'blue'>;

type ExtractCustomStateFromTemplate<T extends IRouterTemplate> = T extends IRouterTemplate<infer S>
    ? S
    : never;

type extractCustomStateFromTemplateTest = ExtractCustomStateFromTemplate<iRouterTemplateTest>;

type ExtractCustomActionsFromTemplate<T extends IRouterTemplate> = T extends IRouterTemplate<
    any, // eslint-disable-line
    infer A
>
    ? A
    : never;

type extractCustomActionsFromTemplateTest = ExtractCustomActionsFromTemplate<iRouterTemplateTest>;

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
    defaultAction?: string[];
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
    CustomState extends {},
    RouterType,
    ParentRouter extends RouterInstance,
    RootRouter extends RouterInstance,
    ChildRouters extends InstanceChildRouters = InstanceChildRouters
> {
    name: string;
    type: RouterType;
    manager: Manager;
    config: IRouterConfig;
    parent?: ParentRouter;
    routers: ChildRouters;
    root?: RootRouter;
    getState?: () => IRouterCurrentAndHistoricalState<CustomState>;
    subscribe?: (observer: Observer<CustomState>) => void;
    actions: string[]; // the router actions derived from the template. Usually 'show' and 'hide'
}

export type InstanceChildRouters<Routers extends RouterInstance[] = RouterInstance[]> = Record<
    string,
    Routers
>;
// export interface IChildRouters {
//     [key: string]: RouterInstance[];
// }

export type Observer<CustomState extends {} = {}> = (
    state: IRouterCurrentAndHistoricalState<CustomState>
) => unknown;

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

export type ActionWraperFn<
    A extends string = string,
    C extends {} = {},
    B extends RouterBase = RouterBase,
    R extends RouterInstance<A, C, B> = RouterInstance<A, C, B>
> = (
    options: IRouterActionOptions,
    existingLocation: IOutputLocation,
    routerInstance: R,
    ctx: ILocationActionContext
) => void;

export type ActionWraperFnDecorator = <
    A extends string = string,
    C extends {} = {},
    B extends RouterBase = RouterBase,
    Fn extends ActionWraperFn<A, C, B> = ActionWraperFn<A, C, B>
>(
    fn: Fn
) => Fn;

export interface IRouterTemplates<
    CustomState extends {} = {},
    ActionNames extends string = string
> {
    [templateName: string]: IRouterTemplate<CustomState, ActionNames>;
}
export interface IManagerInit<CustomTemplates = {}, DefaultTemplates = {}> {
    routerTree?: IRouterDeclaration;
    serializedStateStore?: NativeSerializedStore | BrowserSerializedStore;
    routerStateStore?: DefaultRoutersStateStore;
    router?: typeof RouterBase;
    customTemplates?: CustomTemplates;
    defaultTemplates?: DefaultTemplates;
}
