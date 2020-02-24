import { IRouterBase } from '../types/router_base';
// import Manager from '../manager';
import { IRouterStateStore } from '../types/router_state';
// import defaultTemplates from '../router/template';
import { IRouterCache } from '../types/router_cache';
import { ISerializedStateStore } from './serialized_state';
import { DefaultTemplates } from '../types/router_templates';

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

export type Pathname = string[];

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
// export type IntersectUnionedActions<T> = (T extends any ? ((x: T) => 0) : never) extends ((
//     x: infer R
// ) => 0)
//     ? R
//     : DefaultRouterActions;

/**
 * The default actions all routers should have regardless of what template are based off of
 */
export interface DefaultRouterActions { show: RouterActionFn; hide: RouterActionFn };

/**
 * A convience object used for defining the shape of a router.
 * This is how action methods are added to the base router class via mixins.
 * For the specific action type see `RouterActionFn`.
 */
export type Actions<CustomActionNames extends string | never = never> = CustomActionNames extends string ?
    DefaultRouterActions
    : { [actionName in CustomActionNames]: RouterActionFn } & DefaultRouterActions;

// export type CustomActions<
//     CustomActionNames extends string | null = null
//     > = CustomActionNames extends null
//     ? DefaultRouterActions
//     : { [actionName in CustomActionNames]: RouterActionFn } & DefaultRouterActions;

// type actionsTest = Actions<'hello' | 'goodbye'>;
// type actionsTestA = Actions;
// type actionsTestB = Actions<null>;

/**
 * A convience object used for defining the shape of a router.
 * This is how the reducer method is added to the base router class via mixins.
 * For the specific router type see `RouterReducerFn`.
 */
export type Reducer<CustomState> = {
    reducer: RouterReducerFn<CustomState>;
};

/**
 * The function that defines alterations on the router location.
 * Actions take the existing location and return a new location.
 */
export type RouterActionFn = <
    Templates extends IRouterTemplates,
    RouterTypeName extends NarrowRouterTypeName<keyof Templates>
    >(
    options?: IRouterActionOptions,
    location?: IInputLocation,

    router?: RouterInstance<Templates, RouterTypeName>,
    ctx?: ILocationActionContext
) => IInputLocation;

/**
 * The function that defines a routers reducer function.
 * The reducer is responsible for taking a new location and defining what the state of the router is from that location.
 */
export type RouterReducerFn<CustomState extends {} = {}> = <
    Templates extends IRouterTemplates,
    RouterTypeName extends NarrowRouterTypeName<keyof Templates>
    >(
    location: IInputLocation,
    router: RouterInstance<Templates, RouterTypeName>,
    ctx: { [key: string]: any } // eslint-disable-line
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
// type narrowRouterTypeNameTest = NarrowRouterTypeName<keyof DefaultTemplates>;
// type narrowRouterTypeNameTestA = NarrowRouterTypeName<keyof {}>;

/**
 * Utility type to extract string literals of action names from the actions object in a template
 */
export type NarrowActionNames<
    Actions extends {},
    ActionNames extends string | number | symbol = keyof Actions
    > = ActionNames extends string ? ActionNames : never;
// type narrowActionNamesTest = NarrowActionNames<DefaultTemplates['stack']['actions']>;
// type narrowActionNamesTestA = NarrowActionNames<DefaultTemplates['scene']['actions']>;

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
    [RouterType in keyof T]: RouterInstance<T, NarrowRouterTypeName<RouterType>>;
}[keyof T];
// type parentTest = Parent<DefaultTemplates>;
// type parentTestChildren = parentTest['routers'];

/**
 * The root router instance. This router is at the very top of the router tree.
 * The type should be a specific router instance. Usually it has the name 'root' in the templates object.
 */
export type Root<
    T extends IRouterTemplates,
    Name extends string = 'root'
    > = Name extends NarrowRouterTypeName<keyof T> ? RouterInstance<T, Name> : never;
// type rootTest = Root<DefaultTemplates>;

/**
 * Child router instances. These are the children of the current router.
 * This type is an object with the type { [routerType]: Array<RouterInstance for type>}
 */
export type Childs<T extends IRouterTemplates> = {
    [RouterType in NarrowRouterTypeName<Exclude<keyof T, 'root'>>]?: Array<
        RouterInstance<T, NarrowRouterTypeName<RouterType>>
    >;
};
// type childsTest = Childs<DefaultTemplates>;
// type childsTestValues = childsTest['scene'];

/**
 * -------------------------------------------------
 * Router instance and class
 * -------------------------------------------------
 */

export type RefineTypeName<
    Templates extends IRouterTemplates,
    Name extends string | NarrowRouterTypeName<keyof Templates>
    > = Name extends NarrowRouterTypeName<keyof Templates>
    ? Name
    : NarrowRouterTypeName<keyof Templates>;
// type refineTypeNameTest = RefineTypeName<DefaultTemplates, 'hello'>;
// type refineTypeNameTestA = RefineTypeName<DefaultTemplates, 'scene'>;
// type refineTypeNameTestB = RefineTypeName<DefaultTemplates, string>;

/**
 * The instantiated router class.
 * A router is represented by a router template.
 *
 * If the router type name isn't specified, or is a string, the router instance is a union of all routers
 * that could be constructed from the templates
 * 
 * Note: This type significantly slows down tsserver. Disable importing of it in the manager to make intelisense faster
 */
export type RouterInstance<
    Templates extends IRouterTemplates, // eslint-disable-line
    RouterTypeName extends NarrowRouterTypeName<keyof Templates> | string = NarrowRouterTypeName<
        keyof Templates
    >
    > = RouterTypeName extends NarrowRouterTypeName<keyof Templates>
    ? Actions<ExtractCustomActionNamesFromTemplate<Templates[RouterTypeName]>> &
    Reducer<RouterCurrentState<ExtractCustomStateFromTemplate<Templates[RouterTypeName]>>> &
    IRouterBase<Templates, RouterTypeName>
    : {
        [routerName in NarrowRouterTypeName<keyof Templates>]: Actions<
            ExtractCustomActionNamesFromTemplate<Templates[routerName]>
        > &
        Reducer<RouterCurrentState<ExtractCustomStateFromTemplate<Templates[routerName]>>> &
        IRouterBase<Templates, routerName>;
    }[NarrowRouterTypeName<keyof Templates>];

// // custom templates
// type routerInstanceTestCustom = RouterInstance<
//     Record<'stack', DefaultTemplates['stack']>,
//     'stack'
// >;
// // invalid template
// // TODO the following test should error out since {test:string} isnt a valid template
// type routerInstanceTestInvalidTemplate = RouterInstance<
//     DefaultTemplates & { test: 'string' },
//     string
// >;

// stack
// type routerInstanceTestStack = RouterInstance<DefaultTemplates & { test: 'string' }, 'stack'>;
// type routerInstanceTestStackMethod = routerInstanceTestStack['toFront']; // <--- should not error

// // scene
// type routerInstanceTestScene = RouterInstance<DefaultTemplates, 'scene'>;
// // type routerInstanceTestAToFront = routerInstanceTestScene['toFront']; // <--- should error
// type routerInstanceTestShowA = routerInstanceTestScene['show'];

// // A router instance given an open ended type name should be an intersection of all router types
// type routerInstanceTestUnion = RouterInstance<
//     { custom: DefaultTemplates['data'] } & DefaultTemplates,
//     string
// >;
// // type routerInstanceTestUnionError = routerInstanceTestUnion['toFront']; // <--- should error
// // A router instance given open ended template types should have the default actions
// type routerInstanceTestUnionSuccess = routerInstanceTestUnion['show']; // <--- should not error
// type routerInstanceTestUnionParent = routerInstanceTestUnion['parent']['show'];
// type routerInstanceTestUnionRoot = routerInstanceTestUnion['root']['show'];
// type routerInstanceTestUnionChildren = routerInstanceTestUnion['routers'];

/**
 * The router class.
 * A router is represented by a router template.
 */
export type RouterClass<
    Templates extends IRouterTemplates,
    RouterTypeName extends NarrowRouterTypeName<keyof Templates>
    > = {
        new(args: IRouterBase<Templates, RouterTypeName>['constructor']): RouterInstance<
            Templates,
            RouterTypeName
        >;
    };

// type routerClassTest = InstanceType<RouterClass<DefaultTemplates, 'feature'>>;
// type routerClassTestA = InstanceType<RouterClass<DefaultTemplates, 'stack'>>;

/**
 * -------------------------------------------------
 * Router templates
 * -------------------------------------------------
 */

/**
 * The object holding all router templates keyed by router type
 */
export type IRouterTemplates<
    CustomState extends {} = {},
    CustomActionNames extends string = null
    // > Record<string, IRouterTemplate<CustomState, CustomActionNames>>;
    > = {
        [name: string]: IRouterTemplate<CustomState, CustomActionNames>;
    };
/**
 * The template that defines a specific router type
 */
export interface IRouterTemplate<
    CustomState extends {} = {},
    CustomActionNames extends string = null
    > {
    actions: Actions<CustomActionNames>;
    reducer: RouterReducerFn<CustomState>;
    config: IRouterTemplateConfig;
}
// type iRouterTemplateTest = IRouterTemplate<{ hello: true }, 'big' | 'blue'>;

/**
 * Default router templates
 */

// export type DefaultTemplates = typeof defaultTemplates;
// = {
//     scene: IRouterTemplate<
//         {
//             blueWorld: boolean;
//         },
//         'testAction'
//     >;
//     stack: IRouterTemplate<{}, 'forward' | 'backward' | 'toFront' | 'toBack'>;
//     data: IRouterTemplate<
//         {
//             data?: string;
//         },
//         'setData'
//     >;
//     feature: IRouterTemplate<{}, null>;
//     root: IRouterTemplate<{}, 'rootAction'>;
// };

/**
 * Configuration information that controls settings of routers instantiated from the template
 */
export interface IRouterTemplateConfig {
    canBePathRouter?: boolean;
    isPathRouter?: boolean;
    shouldInverselyActivate?: boolean;
    disableCaching?: boolean;
}

// type B<V> = V extends {[infer T]: any} ? T : undefined;
// type C = B<IRouterTemplateConfig>;
/**
 * The union of all router templates
 */
export type RouterTemplateUnion<T extends IRouterTemplates> = T[keyof T];
// V = Pick<T, keyof T extends string ? null : keyof T >
// > = {
//     [RouterType in keyof V]: V[RouterType];
// }[keyof V] ;
// type routerTemplateUnionTest = RouterTemplateUnion<DefaultTemplates & IRouterTemplates>;
// type routerTemplateUnionTest = RouterTemplateUnion<DefaultTemplates>;

// type EventTypeMap<T extends object> = { [K in keyof T]: T[K] };

// type CallbackEventTypes<T extends object> = T; //EventTypeMap<T>[keyof EventTypeMap<T>];
// type ttt = CallbackEventTypes<DefaultTemplates>;

// https://stackoverflow.com/questions/57125961/how-to-extend-a-type-in-a-type-formula-in-typescript
/**
 * -------------------------------------------------
 * Router template utilities
 * -------------------------------------------------
 */

/**
 * Utility type for extracting custom state from the overall state object in a template
 */
export type ExtractCustomStateFromTemplate<T extends IRouterTemplate> = T extends IRouterTemplate<
    infer S
>
    ? S
    : never;

// type extractCustomStateFromTemplateTest = ExtractCustomStateFromTemplate<iRouterTemplateTest>;
// type extractCustomStateFromTemplateTestUnions = ExtractCustomStateFromTemplate<
//     RouterTemplateUnion<DefaultTemplates>
// >;
// type extractCustomStateFromTemplateMap = ExtractCustomStateFromTemplate<RouterTemplateUnion<AllTemplates>>

/**
 * Utility type for extracting custom action names from the actions defined in a template
 */
export type ExtractCustomActionNamesFromTemplate<T extends IRouterTemplate> = T extends IRouterTemplate<
    any, // eslint-disable-line
    infer A
>
    ? A
    : never;
// type extractCustomActionsFromTemplateTest = ExtractCustomActionNamesFromTemplate<iRouterTemplateTest>;

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
export type RouterHistoricalState<CustomState extends {}> = RouterCurrentState<CustomState>[];

export interface IRouterCurrentAndHistoricalState<CustomState extends {}> {
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
    routers?: Record<string, IRouterDeclaration<Templates>[]>;
    routeKey?: string;
    type?: NarrowRouterTypeName<keyof Templates>;
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
    Templates extends IRouterTemplates,
    RouterTypeName extends NarrowRouterTypeName<keyof Templates>,
    M extends Manager<Templates> = Manager<Templates>
    > {
    name: string;
    type: RouterTypeName;
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
    cache: CacheClass<Templates, RouterTypeName, IRouterCache<Templates, RouterTypeName>>;
}
// type iRouterInitArgsTest = IRouterInitArgs<DefaultTemplates, 'scene'>;
// type iRouterInitArgsTestType = iRouterInitArgsTest['type'];
// type iRouterInitArgsTestParent = iRouterInitArgsTest['parent'];
// type iRouterInitArgsTestRouters = iRouterInitArgsTest['routers'];
// type iRouterInitArgsTestRoot = iRouterInitArgsTest['root'];
// type iRouterInitArgsTestGetState = iRouterInitArgsTest['getState'];
// type iRouterInitArgsTestSubscribe = iRouterInitArgsTest['subscribe'];
// type iRouterInitArgsTestActions = iRouterInitArgsTest['actions'];
// type iRouterInitArgsTestCache = InstanceType<iRouterInitArgsTest['cache']>;
// type iRouterInitArgsTestCacheMethodWithRouter = Parameters<
//     iRouterInitArgsTestCache['setWasPreviouslyVisibleToFromLocation']
// >;

// type iRouterInitArgsTestA = IRouterInitArgs<DefaultTemplates, 'stack'>;
// type iRouterInitArgsTestActionsB = iRouterInitArgsTestA['actions'];

/**
 * The information passed into the create router function.
 * This is also the minimal amount of information an instantiated manager needs
 * to create the router init args and initialize a new router.
 */
export interface IRouterCreationInfo<
    Templates extends IRouterTemplates,
    RouterTypeName extends NarrowRouterTypeName<keyof Templates>
    > {
    name: string;
    config: IRouterConfig;
    type: RouterTypeName;
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
 * Router Cache
 * -------------------------------------------------
 */

/**
 * The class type of a cache store instance
 */
export interface CacheClass<
    Templates extends IRouterTemplates,
    RouterTypeName extends NarrowRouterTypeName<keyof Templates>,
    RouterCache extends IRouterCache<Templates, RouterTypeName>
    > {
    new(): RouterCache;
}

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
    T extends IRouterTemplates,
    N extends NarrowRouterTypeName<keyof T>
    > = Array<
        {
            [RouterType in Exclude<keyof T, N>]?: RouterInstance<T, NarrowRouterTypeName<RouterType>>;
        }[Exclude<keyof T, N>]
    >;
// type neighborsOfTypeTest = NeighborsOfType<DefaultTemplates, 'scene'>;

/**
 * -------------------------------------------------
 * Router utilities
 * -------------------------------------------------
 */

/**
 * Returns the union of all router children. This is useful when dynamically maping over
 * children. For example Object.keys(router.routers)[routerType].map(<THIS TYPE> => ....)
 */
export type UnionOfChildren<T extends IRouterTemplates> = {
    [RouterType in Exclude<keyof T, 'root'>]?: Array<
        RouterInstance<T, NarrowRouterTypeName<RouterType>>
    >;
}[Exclude<keyof T, 'root'>];
// type unionOfChildrenTest = UnionOfChildren<DefaultTemplates>;

/**
 * Utility to extract the template type of a router instance.
 */
// eslint-disable-next-line
export type TemplateOfRouter<R> = R extends RouterInstance<
    infer Templates,
    infer Name // eslint-disable-line
>
    ? Templates[Name]
    : never;

// type templateOfRouterTestAllRouters = RouterInstance<DefaultTemplates>;
// type templateOfRouterTestAllRoutersAllTemplates = TemplateOfRouter<templateOfRouterTestAllRouters>;
// type templateOfRouterTestStackRouter = RouterInstance<DefaultTemplates, 'stack'>;
// type templateOfRouterTestStackRouterTemplate = TemplateOfRouter<templateOfRouterTestStackRouter>;

/**
 * -------------------------------------------------
 * Manager
 * -------------------------------------------------
 */

export type ActionWraperFnDecorator = <Fn extends any>(fn: Fn) => Fn;

/**
 * A map of all templates.
 * Custom templates are spread into the default templates allowing for overrides.
 */
export type AllTemplates<CustomTemplates extends IRouterTemplates = {}> = Spread<
    DefaultTemplates,
    CustomTemplates
>;

// type allTemplatesTestNoCustom = AllTemplates;
// type allTemplatesTest = AllTemplates<{ other: DefaultTemplates['stack'] }>;
// type allTemplatesTestSceneShow = allTemplatesTest['scene']['actions']['show'];
// type allTemplatesTestSceneCustomAction = allTemplatesTest['scene']['actions']['testAction'];
// type allTemplatesTestOtherShow = allTemplatesTest['other']['actions']['show'];
// type allTemplatesTestInstance = RouterInstance<allTemplatesTest, 'scene'>['testAction'];

// type allTemplatesTestOverride = AllTemplates<{ scene: DefaultTemplates['stack'] }>;
// type allTemplatesTestOverrideSceneShow = allTemplatesTestOverride['scene'];
// type allTemplatesTestOverrideInstanceSpecific = RouterInstance<
//     allTemplatesTestOverride,
//     'scene'
// >['toFront'];
// type allTemplatesTestOverrideInstanceAll = RouterInstance<allTemplatesTestOverride>['show'];

/**
 * Types associated with initializing the manager
 */
export interface IManagerInit<CustomTemplates extends IRouterTemplates> {
    routerTree?: IRouterDeclaration<AllTemplates<CustomTemplates>>;
    serializedStateStore?: ISerializedStateStore;
    routerStateStore?: IRouterStateStore<RouterCurrentStateFromTemplates<CustomTemplates>>;
    router?: RouterClass<
        AllTemplates<CustomTemplates>,
        NarrowRouterTypeName<keyof AllTemplates<CustomTemplates>>
    >;
    customTemplates?: CustomTemplates;
    defaultTemplates?: DefaultTemplates;
}

/**
 * Returns a union of all state defined in the map of default and custom templates
 */
export type RouterCurrentStateFromTemplates<
    CustomTemplates extends IRouterTemplates
    > = ExtractCustomStateFromTemplate<RouterTemplateUnion<AllTemplates<CustomTemplates>>>;

/**
 * The routers of a manager.
 * This type is a union of all possible router types found in the templates object.
 *
 */
export type ManagerRouters<T extends IRouterTemplates> = RouterInstance<
    T,
    NarrowRouterTypeName<keyof T>
>;

// type managerRoutersTest = ManagerRouters<{ other: DefaultTemplates['data'] } & DefaultTemplates>;
// type managerRoutersTestAction = managerRoutersTest['setData'];
// type managerRoutersTestAction = managerRoutersTest['show'];

/**
 * The router types of a manager.
 * This type is a map of all possible router types found in the templates object. Each value
 * is a class that can be used to instantiate a specific router from a declaration object that a user supplies.
 */
export type ManagerRouterTypes<T extends IRouterTemplates> = {
    [RouterType in keyof T]: RouterClass<T, NarrowRouterTypeName<RouterType>>;
};
// type managerRouterTypesTest = ManagerRouterTypes<
//     { otherType: DefaultTemplates['stack'] } & DefaultTemplates
// >;
// type managerRouterTypesTestA = managerRouterTypesTest['scene'];

/**
 * -------------------------------------------------
 * Serialized state store
 * -------------------------------------------------
 */

export type StateObserver = (state: IOutputLocation) => any;

/**
 * -------------------------------------------------
 * Router state store
 * -------------------------------------------------
 */

/**
 * The callback function that is passed through when a user subscribes to a specific router.
 */
export type Observer<CustomState extends {}> = (
    state: IRouterCurrentAndHistoricalState<CustomState>
) => unknown;

/**
 * A function created that can be used to register observer functions for a specific router that a manager oversees.
 */
export type RouterStateObserver<CustomState extends {}> = (fn: Observer<CustomState>) => void;

/**
 * An object representing all observers of routers keyed on router name
 */
export type RouterStateObservers<CustomState extends {}> = Record<
    string,
    Array<Observer<CustomState>>
>;

/**
 * Configuration options that can be passed to a router state store
 */
export interface IRouterStateStoreConfig {
    historySize?: number;
}

/**
 * The store object of the router state store
 */
export type RouterStateStoreStore<CustomState extends {}> = Record<
    string,
    IRouterCurrentAndHistoricalState<CustomState>
>;
/**
 * -------------------------------------------------
 * General Utilities
 * -------------------------------------------------
 */

// type JoinIntersection<T extends {}> = {
//     [k in keyof T]: T[k];
// };
// type joinIntersectionTest = JoinIntersection<{other: DefaultTemplates['data']} & DefaultTemplates>;

/**
 * From https://github.com/Microsoft/TypeScript/pull/21316#issuecomment-359574388
 */
export type Diff<T, U> = T extends U ? never : T; // Remove types from T that are assignable to U

// Names of properties in T with types that include undefined
export type OptionalPropertyNames<T> = {
    [K in keyof T]: undefined extends T[K] ? K : never;
}[keyof T];

// Common properties from L and R with undefined in R[K] replaced by type in L[K]
export type SpreadProperties<L, R, K extends keyof L & keyof R> = {
    [P in K]: L[P] | Diff<R[P], undefined>;
};

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

export type Unpacked<T> = T extends (infer U)[]
    ? U // eslint-disable-next-line
    : T extends (...args: any[]) => infer U
    ? U
    : T extends Promise<infer U>
    ? U
    : T;

/**
 * TESTTT
 */

// type KnownKeys<T> = {
//     [K in keyof T]: string extends K ? never : number extends K ? never : K
//   } extends { [_ in keyof T]: infer U } ? U : never;

// type KnownKeys<T> = {
//     [K in keyof T]: string extends K ? never : number extends K ? never : K
// } extends {[_ in keyof T]: infer U} ? ({} extends U ? never : U) : never;

//   type A = {
//       a: number;
//       b: number;
//   }

//   type E = {
//       [a: string]: any;
//       d: number;
//       b: string;
//       z: 'blue';
//   }

//   type D = KnownKeys<E>

//   type CC = Pick<E, D> & Pick<A, KnownKeys<A>>

//   type Merge<T, U> =
// // Picking the known keys from T, requires the introduction of K as a new type parameter
// // We do this in order to make TS know K is a keyof T on the branch we do the pick
// // (Exclude<KnownKeys<T>, keyof U> extends infer K? K extends keyof T ? Pick<T, K> : never: never )
// Pick<T, KnownKeys<T>>
// // Pick the string index signature if any
// & (T extends Record<string, any> ? Pick<T, string> : never)
// // We can also pick the numeric index
// & (T extends Record<number, any> ? Pick<T, number> : never)
// // Intersect with U
// & Pick<U, KnownKeys<U>>;

// type Y = Merge<E, A>
// type YY = Y['z']
