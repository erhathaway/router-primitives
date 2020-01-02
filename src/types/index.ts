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

/**
 * A utility function to intersect unioned actions together
 */
// eslint-disable-next-line
type IntersectUnionedActions<T> = (T extends any ? ((x: T) => 0) : never) extends ((
    x: infer R
) => 0)
    ? R
    : DefaultRouterActions;

/**
 * The default actions all routers should have regardless of what template are based off of
 */
export type DefaultRouterActions = {show: RouterActionFn; hide: RouterActionFn};

/**
 * A convience object used for defining the shape of a router.
 * This is how action methods are added to the base router class via mixins.
 * For the specific action type see `RouterActionFn`.
 */
export type Actions<CustomActionNames extends string | null = null> = IntersectUnionedActions<
    ActionsWithCustomUnioned<CustomActionNames>
>;
export type ActionsWithCustomUnioned<
    CustomActionNames extends string | null = null
> = CustomActionNames extends null
    ? DefaultRouterActions
    : {[actionName in CustomActionNames]: RouterActionFn} & DefaultRouterActions;

type actionsTest = Actions<'hello' | 'goodbye'>;
type actionsTestA = Actions;
type actionsTestB = Actions<null>;

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
    ctx: {[key: string]: any} // eslint-disable-line
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
export type Parent<T extends IRouterTemplates> = {
    [RouterType in keyof T]: RouterInstance<NarrowRouterTypeName<RouterType>, T>;
}[keyof T];
type parentTest = Parent<typeof template>;

/**
 * The root router instance. This router is at the very top of the router tree.
 * The type should be a specific router instance. Usually it has the name 'root' in the templates object.
 */
export type Root<T extends IRouterTemplates> = RouterInstance<'root', T>;
type rootTest = Root<typeof template>;

/**
 * Child router instances. These are the children of the current router.
 * This type is an object with the type { [routerType]: Array<RouterInstance for type>}
 */
export type Childs<T extends IRouterTemplates> = {
    [RouterType in Exclude<keyof T, 'root'>]?: Array<
        RouterInstance<NarrowRouterTypeName<RouterType>, T>
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
    Templates extends IRouterTemplates
> = Actions<ExtractCustomActionsFromTemplate<Templates[RouterTypeName]>> &
    // TODO figured out why intersecting with default actions is required here.
    // In the data template, `show` action isnt present without it, but all router instances
    // should have it by default
    DefaultRouterActions &
    Reducer<RouterCurrentState<ExtractCustomStateFromTemplate<Templates[RouterTypeName]>>> &
    RouterBase<RouterTypeName, Templates>;

type routerInstanceTest = RouterInstance<'stack', typeof template>;
type routerInstanceTestA = RouterInstance<'scene', typeof template>;
type routerInstanceTestShow = routerInstanceTest['toFront'];
type routerInstanceTestShowA = routerInstanceTestA['show'];

/**
 * The router class.
 * A router is represented by a router template.
 */
export type RouterClass<RouterTypeName extends string, Templates extends IRouterTemplates> = {
    new (...args: ConstructorParameters<typeof RouterBase>): RouterInstance<
        RouterTypeName,
        Templates
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
    isActive?: boolean;
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
export interface IRouterDeclaration<Templates extends IRouterTemplates> {
    name: string;
    routers?: Record<NarrowRouterTypeName<keyof Templates>, IRouterDeclaration<Templates>[]>;
    routeKey?: string;
    type?: NarrowRouterTypeName<keyof Templates>;
    parentName?: NarrowRouterTypeName<keyof Templates>;

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
    type: NarrowRouterTypeName<RouterTypeName>;
    manager: M;
    config: IRouterConfig;
    parent?: Parent<Templates>;
    routers: Childs<Templates>;
    root: Root<Templates>;
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
    defaultAction?: string[];
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
            RouterInstance<NarrowRouterTypeName<RouterType>, T>
        >;
    }[Exclude<keyof T, TypeName>]
>;
type neighborsOfTypeTest = NeighborsOfType<'scene', typeof template>;

/**
 * -------------------------------------------------
 * Manager
 * -------------------------------------------------
 */

export type ActionWraperFnDecorator = <Fn extends RouterActionFn>(fn: Fn) => Fn;

export interface IManagerInit<
    CustomTemplates extends IRouterTemplates = {},
    DefaultTemplates extends IRouterTemplates = {}
> {
    routerTree?: IRouterDeclaration<CustomTemplates & DefaultTemplates>;
    serializedStateStore?: NativeSerializedStore | BrowserSerializedStore;
    routerStateStore?: DefaultRoutersStateStore;
    router?: RouterClass<
        NarrowRouterTypeName<keyof (CustomTemplates & DefaultTemplates)>,
        CustomTemplates & DefaultTemplates
    >;
    customTemplates?: CustomTemplates;
    defaultTemplates?: DefaultTemplates;
}

/**
 * The routers of a manager.
 * This type is a union of all possible router types found in the templates object.
 */
export type ManagerRouters<T extends IRouterTemplates> = {
    [RouterType in keyof T]: RouterInstance<NarrowRouterTypeName<RouterType>, T>;
}[keyof T];
type managerRoutersTest = ManagerRouters<typeof template>;

/**
 * The router types of a manager.
 * This type is a union of all possible router types found in the templates object. Each type
 * is a class that can be used to instantiate a specific router from a declaration object that a user supplies.
 */
export type ManagerRouterTypes<T extends IRouterTemplates> = {
    [RouterType in keyof T]: RouterClass<NarrowRouterTypeName<RouterType>, T>;
};
type managerRouterTypesTest = ManagerRouterTypes<typeof template>;

/**
 * -------------------------------------------------
 * General Utilities
 * -------------------------------------------------
 */

/**
 * From https://github.com/Microsoft/TypeScript/pull/21316#issuecomment-359574388
 */
// Names of properties in T with types that include undefined
type OptionalPropertyNames<T> = {[K in keyof T]: undefined extends T[K] ? K : never}[keyof T];

// Common properties from L and R with undefined in R[K] replaced by type in L[K]
type SpreadProperties<L, R, K extends keyof L & keyof R> = {[P in K]: L[P] | Diff<R[P], undefined>};

type Diff<T, U> = T extends U ? never : T; // Remove types from T that are assignable to U

// Type of { ...L, ...R }
export type Spread<L, R> =
    // Properties in L that don't exist in R
    Pick<L, Diff<keyof L, keyof R>> &
        // Properties in R with types that exclude undefined
        Pick<R, Diff<keyof R, OptionalPropertyNames<R>>> &
        // Properties in R, with types that include undefined, that don't exist in L
        Pick<R, Diff<OptionalPropertyNames<R>, keyof L>> &
        // Properties in R, with types that include undefined, that exist in L
        SpreadProperties<L, R, OptionalPropertyNames<R> & keyof L>;
