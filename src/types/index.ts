import RouterBase from '../router/base';
import Manager from '../manager';
import {NativeSerializedStore, BrowserSerializedStore} from '../serializedState';
import DefaultRoutersStateStore from '../routerState';
import template from '../router/template';
import Cache from '../router/cache';

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

// at the moment these should be the same
export type IRouterActionOptions = ILocationOptions;

/**
 * -------------------------------------------------
 * Router actions and reducer
 * -------------------------------------------------
 */

type Intersect<T> = (T extends any ? ((x: T) => 0) : never) extends ((x: infer R) => 0) ? R : never;

/**
 * A convience object used for defining the shape of a router.
 * This is how action methods are added to the base router class via mixins.
 * For the specific action type see `RouterActionFn`.
 */
export type Actions<CustomActionNames extends string | null = null> = Intersect<
    ActionsWithCustomUnioned<CustomActionNames>
>;
export type ActionsWithCustomUnioned<
    CustomActionNames extends string | null = null
> = CustomActionNames extends null
    ? {show: RouterActionFn; hide: RouterActionFn}
    : {[actionName in CustomActionNames]: RouterActionFn} & {
          show: RouterActionFn;
          hide: RouterActionFn;
      };

type actionsTest = Actions<'hello' | 'goodbye'>;
type actionsTestA = Actions;

/**
 * A convience object used for defining the shape of a router.
 * This is how the reducer method is added to the base router class via mixins.
 * For the specific router type see `RouterReducerFn`.
 */
export type Reducer<CurrentState> = {
    reducer: RouterReducerFn<CurrentState>;
};

/**
 * The function that defines alterations on the router location.
 * Actions take the existing location and return a new location.
 */
export type RouterActionFn = <RouterTypeName extends string, Templates extends IRouterTemplates>(
    options?: IRouterActionOptions,
    location?: IInputLocation,
    router?: RouterInstance<RouterTypeName, Templates>,
    ctx?: ILocationActionContext
) => IInputLocation;

/**
 * The function that defines a routers reducer function.
 * The reducer is responsible for taking a new location and defining what the state of the router is from that location.
 */
export type RouterReducerFn<CustomState extends {} = {}> = <
    RouterTypeName extends string,
    Templates extends IRouterTemplates
>(
    location: IInputLocation,
    router: RouterInstance<RouterTypeName, Templates>,
    ctx: {[key: string]: any}
) => RouterCurrentState<CustomState>;

/**
 * -------------------------------------------------
 * Router utilities
 * -------------------------------------------------
 */

/**
 * Utility type to extract string literals of router type names from a templates object. A templates object is an
 * object of templates with the type { [routerTypeName]: template }.
 */
export type NarrowRouterTypeName<Names extends string | number | symbol> = Names extends string
    ? Names
    : never;
type narrowRouterTypeNameTest = NarrowRouterTypeName<keyof typeof template>;

/**
 * Utility type to extract string literals of action names from the actions object in a template
 */
export type NarrowActionNames<
    Actions extends {},
    ActionNames extends string | number | symbol = keyof Actions
> = ActionNames extends string ? ActionNames : never;
type narrowActionNamesTest = NarrowActionNames<typeof template.stack['actions']>;
type narrowActionNamesTestA = NarrowActionNames<typeof template.scene['actions']>;

/**
 * -------------------------------------------------
 * Router parent, root, and children
 * -------------------------------------------------
 */

/**
 * The parent router instance. This router is the immediate parent of the current router.
 * This type is a union of all possible router types found in the templates object.
 */
export type Parent<T extends IRouterTemplates, M extends Manager = Manager> = {
    [RouterType in keyof T]: RouterInstance<
        NarrowRouterTypeName<RouterType>,
        T,
        M,
        Cache<NarrowRouterTypeName<RouterType>, T>
    >;
}[keyof T];
type parentTest = Parent<typeof template>;

/**
 * The root router instance. This router is at the very top of the router tree.
 * The type should be a specific router instance. Usually it has the name 'root' in the templates object.
 */
export type Root<T extends IRouterTemplates, M extends Manager = Manager> = RouterInstance<
    'root',
    T,
    M,
    Cache<'root', T>
>;
type rootTest = Root<typeof template>;

/**
 * Child router instances. These are the children of the current router.
 * This type is an object with the type { [routerType]: Array<RouterInstance for type>}
 */
export type Childs<T extends IRouterTemplates, M extends Manager = Manager> = {
    [RouterType in Exclude<keyof T, 'root'>]?: Array<
        RouterInstance<
            NarrowRouterTypeName<RouterType>,
            T,
            M,
            Cache<NarrowRouterTypeName<RouterType>, T>
        >
    >;
};
type childsTest = Childs<typeof template>;

/**
 * -------------------------------------------------
 * Router instance and class
 * -------------------------------------------------
 */

/**
 * The instantiated router class.
 * A router is represented by a router template.
 */
export type RouterInstance<
    RouterTypeName extends string,
    Templates extends IRouterTemplates,
    M extends Manager = Manager,
    C extends Cache<RouterTypeName, Templates> = Cache<RouterTypeName, Templates>
> = Actions<ExtractCustomActionsFromTemplate<Templates[RouterTypeName]>> &
    Reducer<RouterCurrentState<ExtractCustomStateFromTemplate<Templates[RouterTypeName]>>> &
    RouterBase<RouterTypeName, Templates>;

type routerInstanceTest = RouterInstance<'stack', typeof template>;
type routerInstanceTestA = RouterInstance<'scene', typeof template>;

/**
 * The router class.
 * A router is represented by a router template.
 */
export type RouterClass<
    RouterTypeName extends string,
    Templates extends IRouterTemplates,
    M extends Manager = Manager,
    C extends Cache<RouterTypeName, Templates> = Cache<RouterTypeName, Templates>
> = {
    new (...args: ConstructorParameters<typeof RouterBase>): RouterInstance<
        RouterTypeName,
        Templates,
        M,
        C
    >;
};

type routerClassTest = InstanceType<RouterClass<'feature', typeof template>>;
type routerClassTestA = InstanceType<RouterClass<'stack', typeof template>>;

/**
 * -------------------------------------------------
 * Router templates
 * -------------------------------------------------
 */

/**
 * The object holding all router templates keyed by router type
 */
export interface IRouterTemplates<
    CustomState extends {} = {},
    CustomActionNames extends string = null
> {
    [templateName: string]: IRouterTemplate<CustomState, CustomActionNames>;
}

/**
 * The template that defines a specific router type
 */
export interface IRouterTemplate<
    CustomState extends {} = {},
    CustomActionNames extends string = null
> {
    actions: Actions<CustomActionNames>;
    reducer: RouterReducerFn<RouterCurrentState<CustomState>>;
    config: IRouterTemplateConfig;
}
type iRouterTemplateTest = IRouterTemplate<{hello: true}, 'big' | 'blue'>;

/**
 * Configuration information that controls settings of routers instantiated from the template
 */
export interface IRouterTemplateConfig {
    canBePathRouter?: boolean;
    isPathRouter?: boolean;
    shouldInverselyActivate?: boolean;
    disableCaching?: boolean;
}
/**
 * -------------------------------------------------
 * Router template utilities
 * -------------------------------------------------
 */

/**
 * Utility type for extracting custom state from the overall state object
 */
export type ExtractCustomStateFromTemplate<T extends IRouterTemplate> = T extends IRouterTemplate<
    infer S
>
    ? S
    : never;
type extractCustomStateFromTemplateTest = ExtractCustomStateFromTemplate<iRouterTemplateTest>;

/**
 * Utility type for extracting custom action names from the actions defined in a template
 */
export type ExtractCustomActionsFromTemplate<T extends IRouterTemplate> = T extends IRouterTemplate<
    any, // eslint-disable-line
    infer A
>
    ? A
    : never;
type extractCustomActionsFromTemplateTest = ExtractCustomActionsFromTemplate<iRouterTemplateTest>;

/**
 * -------------------------------------------------
 * Router state
 * -------------------------------------------------
 */

/**
 * The current router state.
 * Defined as an intersection of custom state defined in the templates and default state.
 */
export type RouterCurrentState<CustomState extends {} = {}> = CustomState & {
    visible?: boolean;
    data?: string;
};

/**
 * The historical state of a router.
 * Defined as an array of state objects with the smaller index being the more recent state
 */
export type RouterHistoricalState<CustomState extends {} = {}> = RouterCurrentState<CustomState>[];

export interface IRouterCurrentAndHistoricalState<CustomState extends {} = {}> {
    current: RouterCurrentState<CustomState>;
    historical: RouterHistoricalState<CustomState>;
}

/**
 * -------------------------------------------------
 * Router serialization
 * -------------------------------------------------
 */

/**
 * Options used for configuring how the router tree can be serialized into a JSON object
 */
export interface ISerializeOptions {
    showDefaults?: boolean; // shows default options
    showType?: boolean; // shows the type even when it can be inferred from the parent type
    alwaysShowRouteKey?: boolean; // shows the route key even when its not different from the router name
    showParentName?: boolean;
}

/**
 * -------------------------------------------------
 * Router creation
 * -------------------------------------------------
 */

/**
 * The router declaration object.
 * This is a user defined object used to define routers used in an app.
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
 * The arguments passed into a router constructor (by a manager) to initialize a router.
 */
export interface IRouterInitArgs<
    RouterTypeName extends string,
    Templates extends IRouterTemplates,
    M extends Manager = Manager
> {
    name: string;
    type: RouterTypeName;
    manager: M;
    config: IRouterConfig;
    parent?: Parent<Templates, M>;
    routers: Childs<Templates, M>;
    root: Root<Templates, M>;
    getState?: () => IRouterCurrentAndHistoricalState<
        ExtractCustomStateFromTemplate<Templates[RouterTypeName]>
    >;
    subscribe?: (
        observer: Observer<ExtractCustomStateFromTemplate<Templates[RouterTypeName]>>
    ) => void;
    actions: (keyof Templates[RouterTypeName]['actions'])[]; // the router actions derived from the template. Usually 'show' and 'hide';
    cache: CacheClass<RouterTypeName, Templates, Cache<RouterTypeName, Templates>>;
}
type iRouterInitArgsTest = IRouterInitArgs<'scene', typeof template>;
type iRouterInitArgsTestType = iRouterInitArgsTest['type'];
type iRouterInitArgsTestParent = iRouterInitArgsTest['parent'];
type iRouterInitArgsTestRouters = iRouterInitArgsTest['routers'];
type iRouterInitArgsTestRoot = iRouterInitArgsTest['root'];
type iRouterInitArgsTestGetState = iRouterInitArgsTest['getState'];
type iRouterInitArgsTestSubscribe = iRouterInitArgsTest['subscribe'];
type iRouterInitArgsTestActions = iRouterInitArgsTest['actions'];
type iRouterInitArgsTestCache = InstanceType<iRouterInitArgsTest['cache']>;
type iRouterInitArgsTestCacheMethodWithRouter = Parameters<
    iRouterInitArgsTestCache['setWasPreviouslyVisibleToFromLocation']
>;

type iRouterInitArgsTestA = IRouterInitArgs<'stack', typeof template>;
type iRouterInitArgsTestActionsB = iRouterInitArgsTestA['actions'];

/**
 * The information passed into the create router function.
 * This is also the minimal amount of information an instantiated manager needs
 * to create the router init args and initialize a new router.
 */
export interface IRouterCreationInfo<RouterType extends string> {
    name: string;
    config: IRouterConfig;
    type: RouterType;
    parentName?: string;
}

/**
 * Computed information from the template default config and router declaration
 */
export interface IRouterConfig {
    routeKey: string;
    isPathRouter: boolean;
    shouldInverselyActivate: boolean;
    disableCaching?: boolean; // optional b/c the default is to use the parents
    defaultAction: string[];
}

/**
 * -------------------------------------------------
 * Router subscription
 * -------------------------------------------------
 */

/**
 * The callback function that is passed through when a user subscribes to a specific router
 */
export type Observer<CustomState extends {} = {}> = (
    state: IRouterCurrentAndHistoricalState<CustomState>
) => unknown;

/**
 * -------------------------------------------------
 * Router Cache
 * -------------------------------------------------
 */

/**
 * The class type of a cache store instance
 */
export type CacheClass<
    RouterTypeName extends string,
    Templates extends IRouterTemplates,
    RouterCache extends Cache<RouterTypeName, Templates>
> = {new (...args: ConstructorParameters<typeof Cache>): RouterCache};

/**
 * -------------------------------------------------
 * Router methods
 * -------------------------------------------------
 */

/**
 * Returns an array of a router instances neighbors. That is, all router instances that are not of this type
 * in side an array.
 */
export type NeighborsOfType<
    TypeName extends string,
    T extends IRouterTemplates,
    M extends Manager = Manager
> = Array<
    {
        [RouterType in Exclude<keyof T, TypeName>]?: Array<
            RouterInstance<
                NarrowRouterTypeName<RouterType>,
                T,
                M,
                Cache<NarrowRouterTypeName<RouterType>, T>
            >
        >;
    }[Exclude<keyof T, TypeName>]
>;
type neighborsOfTypeTest = NeighborsOfType<'scene', typeof template>;

/**
 * -------------------------------------------------
 * Manager
 * -------------------------------------------------
 */
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

export interface IManagerInit<CustomTemplates = {}, DefaultTemplates = {}> {
    routerTree?: IRouterDeclaration;
    serializedStateStore?: NativeSerializedStore | BrowserSerializedStore;
    routerStateStore?: DefaultRoutersStateStore;
    router?: typeof RouterBase;
    customTemplates?: CustomTemplates;
    defaultTemplates?: DefaultTemplates;
}
