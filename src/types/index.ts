import {IRouterBase} from '../types/router_base';
import {IManager} from '../types/manager';
import {IRouterStateStore} from '../types/router_state';
import {IRouterCache} from '../types/router_cache';
import {ISerializedStateStore} from '../types/serialized_state';
import {DefaultTemplates} from '../types/router_templates';
import {ITracerThing} from '../tracer';

export type Constructable<T = {}> = new (...args: any[]) => T; // eslint-disable-line

// Options are for a specific router within an update cycle
// Context is for all routers within an update cycle

/**
 * Location types
 */
/**
 * A map of router state (query params) that will be serialized into the serialized state store.
 * In the case of the BrowserSerializedStateStore, these will be the query params
 * part of a URL.
 *
 * TODO add support for more than just `string` types
 */
export interface IInputSearch {
    [key: string]: string | string[] | number | number[] | boolean | undefined;
}

/**
 * A map of router state (query params) that were unserialized from the serialized state store.
 * In the casae of the BrowserSerializedStateStore, these will be deserialized query params.
 *
 * Note: the value of the map must is equal or narrower than then the value of the IInputSearch map.
 * This is becuase the output is used as input in some cases. For example, updating existing state and needing to
 * spread new state into existing state.
 *
 * TODO add support for `map` types.
 */
export interface IOutputSearch {
    [key: string]: string | string[] | number | number[] | boolean | undefined;
}

// at the moment these should be the same
export interface ILocationOptions {
    replaceLocation?: boolean; // used to replace history location in URL
}

export interface IRouterActionOptions<CustomState> {
    data?: CustomState;
    disableCaching?: boolean; // the setting will only persist for the router
    replaceLocation?: boolean; // used to replace history location in URL
    dryRun?: boolean; // will prevent cache from being updated or the new location state from being stored
    addCacheToLocation?: boolean; // serializes the current router cache into the location. Useful for rehydrating exact router state.
}

export type Pathname = string[];

/**
 * The state that comes out of the serialized state store.
 * For example, with the BrowserSerializedStateStore, the IOutputLocation
 * would be the deserialized URL.
 */
export interface IOutputLocation {
    pathname: Pathname;
    search: IOutputSearch;
    // options: ILocationOptions;
}

export interface IInputLocation {
    pathname: Pathname;
    search: IInputSearch;
    options?: ILocationOptions;
}

export interface ILocationActionContext<
    CustomTemplates extends IRouterTemplates,
    Name extends NarrowRouterTypeName<keyof AllTemplates<CustomTemplates>>
> {
    disableCaching?: boolean; // the setting will persist for all routers in the update cycle
    addingDefaults?: boolean;
    // inverseActivation?: boolean;
    callDirection?: 'up' | 'down' | 'lateral' | undefined;
    activatedByChildType?: string;
    tracer?: ITracerThing;
    actionName: string;
    actionFn?: RouterActionFn<CustomTemplates, Name>;
    dryRun?: boolean;
}

export type ReducerContext<
    CustomTemplates extends IRouterTemplates,
    Name extends NarrowRouterTypeName<keyof AllTemplates<CustomTemplates>>
> = Omit<ILocationActionContext<CustomTemplates, Name>, 'actionName' | 'actionFn'>;

/**
 * -------------------------------------------------
 * Router actions and reducer
 * -------------------------------------------------
 */

export type ActionStep = <
    CustomTemplates extends IRouterTemplates,
    Name extends NarrowRouterTypeName<keyof AllTemplates<CustomTemplates>>
>(
    _options: IRouterActionOptions<RouterCustomStateFromTemplates<AllTemplates<CustomTemplates>>>,
    existingLocation: IInputLocation,
    routerInstance: RouterInstance<CustomTemplates, Name>,
    ctx: ILocationActionContext<CustomTemplates, Name>
) => {location: IInputLocation; ctx: ILocationActionContext<CustomTemplates, Name>};

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
export interface DefaultRouterActions<
    CustomTemplates extends IRouterTemplates<undefined>,
    RouterTypeName extends NarrowRouterTypeName<keyof AllTemplates<CustomTemplates>>
> {
    show: RouterActionFn<CustomTemplates, RouterTypeName>;
    hide: RouterActionFn<CustomTemplates, RouterTypeName>;
}

/**
 * A utility function to intersect unioned actions together
 */
export type IntersectUnionedActions<
    T,
    CustomTemplates extends IRouterTemplates<undefined>,
    RouterTypeName extends NarrowRouterTypeName<keyof AllTemplates<CustomTemplates>>
> = (T extends any // eslint-disable-line
  ? (x: T) => 0
  : never) extends (x: infer R) => 0
    ? R
    : DefaultRouterActions<CustomTemplates, RouterTypeName>;

/**
 * A convience object used for defining the shape of a router.
 * This is how action methods are added to the base router class via mixins.
 * For the specific action type see `RouterActionFn`.
 */
// export type Actions<
//     CustomActionNames extends string | null = null
//     > = CustomActionNames extends null
//     ? DefaultRouterActions
//     : { [actionName in CustomActionNames]: RouterActionFn } & DefaultRouterActions;

export type Actions<
    CustomActionNames extends string | null,
    CustomTemplates extends IRouterTemplates<undefined>,
    RouterTypeName extends NarrowRouterTypeName<keyof AllTemplates<CustomTemplates>>
> = IntersectUnionedActions<
    ActionsWithCustomUnioned<CustomActionNames, CustomTemplates, RouterTypeName>,
    CustomTemplates,
    RouterTypeName
> &
    DefaultRouterActions<CustomTemplates, RouterTypeName>;

export type ActionsWithCustomUnioned<
    CustomActionNames extends string | null,
    CustomTemplates extends IRouterTemplates<undefined>,
    RouterTypeName extends NarrowRouterTypeName<keyof AllTemplates<CustomTemplates>>
> = CustomActionNames extends null
    ? DefaultRouterActions<CustomTemplates, RouterTypeName>
    : {[actionName in CustomActionNames]: RouterActionFn<CustomTemplates, RouterTypeName>} &
          DefaultRouterActions<CustomTemplates, RouterTypeName>;

// export type CustomActions<
//     CustomActionNames extends string | null = null
//     > = CustomActionNames extends null
//     ? DefaultRouterActions
//     : { [actionName in CustomActionNames]: RouterActionFn } & DefaultRouterActions;

type actionsTest = Actions<'hello' | 'goodbye', {}, 'scene'>;
type actionsTestAction = actionsTest['hello'];
// type actionsTestA = Actions;
// type actionsTestB = Actions<null>;

/**
 * A convience object used for defining the shape of a router.
 * This is how the reducer method is added to the base router class via mixins.
 * For the specific router type see `RouterReducerFn`.
 */
export type Reducer<
    CustomTemplates extends IRouterTemplates<unknown>,
    RouterTypeName extends NarrowRouterTypeName<keyof AllTemplates<CustomTemplates>>
> = {
    reducer: RouterReducerFn<CustomTemplates, RouterTypeName>;
};

/**
 * The function that defines alterations on the router location.
 * Actions take the existing location and return a new location.
 */
export type RouterActionFn<
    CustomTemplates extends IRouterTemplates,
    RouterTypeName extends NarrowRouterTypeName<keyof AllTemplates<CustomTemplates>>
> = (
    options?: IRouterActionOptions<RouterCustomStateFromTemplates<AllTemplates<CustomTemplates>>>,
    existingLocation?: IOutputLocation,

    routerInstance?: RouterInstance<CustomTemplates, RouterTypeName>,
    ctx?: ILocationActionContext<CustomTemplates, RouterTypeName>
) => IInputLocation;

// <Name extends NarrowRouterTypeName<keyof AllTemplates<CustomTemplates>>>
//     (options?: ILocationOptions, existingLocation?: IOutputLocation, routerInstance?: RouterInstance<...>, ctx?: ILocationActionContext) => IInputLocation

/**
 * The function that defines a routers reducer function.
 * The reducer is responsible for taking a new location and defining what the state of the router is from that location.
 */
export type RouterReducerFn<
    CustomTemplates extends IRouterTemplates<unknown>,
    RouterTypeName extends NarrowRouterTypeName<keyof AllTemplates<CustomTemplates>>
> = (
    location: IInputLocation,
    router: RouterInstance<CustomTemplates, RouterTypeName>,
    ctx: ReducerContext<CustomTemplates, RouterTypeName>
) => RouterCurrentState<
    ExtractCustomStateFromTemplate<AllTemplates<CustomTemplates>[RouterTypeName]>
>;

type RouterReducerFnTest = RouterReducerFn<{}, 'data'>;
type RouterReducerFnTestReturn = ReturnType<RouterReducerFnTest>;

export type TemplateReducer<
    CustomState = undefined,
    CustomActionNames extends string = undefined
> = (
    location: IInputLocation,
    router: TemplateRouter<CustomState, CustomActionNames>,
    ctx: ReducerContext<any, any> // eslint-disable-line
) => RouterCurrentState<CustomState>;

// type RItesttt = RI<{template: IRouterTemplate<string, 'hello' | 'world'>}, 'template'>;

type RouterReducerFnTestString = TemplateReducer<string>;
type RouterReducerFnTestStringActions = TemplateReducer<string, 'what' | 'how'>;
type RouterReducerFnTestStringReturn = ReturnType<TemplateReducer<string>>;

export type TemplateAction<
    CustomState = undefined,
    CustomActionNames extends string = undefined
> = (
    options?: IRouterActionOptions<CustomState>,
    existingLocation?: IOutputLocation,
    routerInstance?: TemplateRouter<CustomState, CustomActionNames>,
    ctx?: ILocationActionContext<any, any>
) => IInputLocation;

type RouterActionFnTestString = TemplateAction<string>;
type RouterActionFnTestStringActions = TemplateAction<string, 'what' | 'how'>;
type RouterActionFnTestStringReturn = ReturnType<TemplateAction<string>>;

export type TemplateRouter<
    CustomState = undefined,
    CustomActionNames extends string = undefined
> = RouterInstance<{template: IRouterTemplate<CustomState, CustomActionNames>}, 'template'>;
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
export type Parent<CustomTemplates extends IRouterTemplates<unknown>> = {
    [RouterType in keyof AllTemplates<CustomTemplates>]: RouterInstance<
        CustomTemplates,
        NarrowRouterTypeName<RouterType>
    >;
}[keyof AllTemplates<CustomTemplates>];
// type parentTest = Parent<DefaultTemplates>;
// type parentTestChildren = parentTest['routers'];

/**
 * The root router instance. This router is at the very top of the router tree.
 * The type should be a specific router instance. Usually it has the name 'root' in the templates object.
 */
export type Root<
    CustomTemplates extends IRouterTemplates<unknown>,
    Name extends string = 'root'
> = Name extends NarrowRouterTypeName<keyof AllTemplates<CustomTemplates>>
    ? RouterInstance<CustomTemplates, Name>
    : never;
// type rootTest = Root<DefaultTemplates>;

/**
 * A map of all child router instances keyed by router type.
 * Ex: { [routerType]: Array<RouterInstance for type>}.
 */
export type Childs<CustomTemplates extends IRouterTemplates<unknown>> = {
    [RouterType in NarrowRouterTypeName<keyof AllTemplates<CustomTemplates>>]?: Array<
        // [RouterType in NarrowRouterTypeName<Exclude<keyof T, 'root'>>]?: Array<

        // [RouterType in NarrowRouterTypeName<keyof T>]?: Array<

        RouterInstance<CustomTemplates, NarrowRouterTypeName<RouterType>>
    >;
};
type childsTest = Childs<DefaultTemplates>;
type childsTestValues = childsTest['stack'][0]['state'];
type childsTestValuesState = childsTest['stack'][0]['state'];
type childsTestValuesStack = childsTest['stack'][0]['toFront'];
type childsTestAll = Childs<AllTemplates<never>>['stack'];
type childsTestValuesData = childsTest['data'][0]['state'];

const a: Childs<AllTemplates<IRouterTemplates>> = {};
a['scene'];

type v = Childs<
    Spread<
        {
            scene: IRouterTemplate<{blueWorld: boolean}, 'testAction'>;
            stack: IRouterTemplate<{}, 'forward' | 'backward' | 'toFront' | 'toBack'>;
        },
        {}
    >
>;
type c = v['stack'];
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
    CustomTemplates extends IRouterTemplates<unknown>, // eslint-disable-line
    RouterTypeName extends
        | NarrowRouterTypeName<keyof AllTemplates<CustomTemplates>>
        | string = NarrowRouterTypeName<keyof AllTemplates<CustomTemplates>>
> = RouterTypeName extends NarrowRouterTypeName<keyof AllTemplates<CustomTemplates>>
    ? Actions<
          ExtractCustomActionNamesFromTemplate<AllTemplates<CustomTemplates>[RouterTypeName]>,
          CustomTemplates,
          RouterTypeName
      > &
          Reducer<CustomTemplates, RouterTypeName> &
          IRouterBase<CustomTemplates, RouterTypeName>
    : {
          [rType in NarrowRouterTypeName<keyof AllTemplates<CustomTemplates>>]: Actions<
              ExtractCustomActionNamesFromTemplate<AllTemplates<CustomTemplates>[rType]>,
              CustomTemplates,
              rType
          > &
              Reducer<CustomTemplates, rType> &
              IRouterBase<CustomTemplates, rType>;
      }[NarrowRouterTypeName<keyof AllTemplates<CustomTemplates>>];

// export type RI<
//     CustomTemplates extends IRouterTemplates<unknown>, // eslint-disable-line
//     RouterTypeName extends NarrowRouterTypeName<keyof AllTemplates<CustomTemplates>>
// > = Actions<ExtractCustomActionNamesFromTemplate<AllTemplates<CustomTemplates>[RouterTypeName]>> &
//     Reducer<CustomTemplates, RouterTypeName> &
//     IRouterBase<CustomTemplates, RouterTypeName>;

// type RItest = RI<{template: IRouterTemplate<string, 'hello' | 'world'>}, 'template'>;
// export type RouterInstance<
//     Templates extends IRouterTemplates, // eslint-disable-line
//     RouterTypeName extends NarrowRouterTypeName<keyof Templates> | string = NarrowRouterTypeName<
//         keyof Templates
//     >
//     > = RouterTypeName extends NarrowRouterTypeName<keyof Templates>
//     ? Actions<ExtractCustomActionNamesFromTemplate<Templates[RouterTypeName]>> &
//     Reducer<RouterCurrentState<ExtractCustomStateFromTemplate<Templates[RouterTypeName]>>> &
//     IRouterBase<Templates, RouterTypeName>
//     : {
//         [routerName in NarrowRouterTypeName<keyof Templates>]: Actions<
//             ExtractCustomActionNamesFromTemplate<Templates[routerName]>
//         > &
//         Reducer<RouterCurrentState<ExtractCustomStateFromTemplate<Templates[routerName]>>> &
//         IRouterBase<Templates, routerName>;
//     }[NarrowRouterTypeName<keyof Templates>];

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
type routerInstanceTestStack = RouterInstance<
    DefaultTemplates & {test: DefaultTemplates['stack']},
    'test'
>;
type routerInstanceTestStackMethod = routerInstanceTestStack['toFront']; // <--- should not error

// scene
type routerInstanceTestScene = RouterInstance<DefaultTemplates, 'scene'>;
// type routerInstanceTestAToFront = routerInstanceTestScene['toFront']; // <--- should error
type routerInstanceTestShowA = routerInstanceTestScene['show'];

// A router instance given an open ended type name should be an intersection of all router types
type routerInstanceTestUnion = RouterInstance<
    {custom: DefaultTemplates['data']} & DefaultTemplates,
    string
>;
// type routerInstanceTestUnionError = routerInstanceTestUnion['toFront']; // <--- should error
// A router instance given open ended template types should have the default actions
type routerInstanceTestUnionSuccess = routerInstanceTestUnion['show']; // <--- should not error
type routerInstanceTestUnionParent = routerInstanceTestUnion['parent']['show'];
type routerInstanceTestUnionRoot = routerInstanceTestUnion['root']['show'];
type routerInstanceTestUnionChildren = routerInstanceTestUnion['routers'];

/**
 * The router class.
 * A router is represented by a router template.
 */
export type RouterClass<
    CustomTemplates extends IRouterTemplates<unknown>,
    RouterTypeName extends NarrowRouterTypeName<keyof AllTemplates<CustomTemplates>>
> = {
    new (
        args: IRouterInitArgs<CustomTemplates, NarrowRouterTypeName<RouterTypeName>>
    ): RouterInstance<CustomTemplates, RouterTypeName>;
};

// type routerClassTestA = InstanceType<RouterClass<DefaultTemplates, 'feature', IManager<null>>>;
// type routerClassTestB = InstanceType<
//     RouterClass<DefaultTemplates, 'feature', IManager<IRouterTemplates>>
// >;
type routerClassTestA = InstanceType<RouterClass<DefaultTemplates, 'feature'>>;
type routerClassTestB = InstanceType<RouterClass<DefaultTemplates, 'feature'>>;

type routerClassTestC = routerClassTestA['root'];

// type routerClassTestA = InstanceType<RouterClass<DefaultTemplates, 'stack'>>;

/**
 * -------------------------------------------------
 * Router templates
 * -------------------------------------------------
 */

/**
 * The object holding all router templates keyed by router type
 */
export type IRouterTemplates<CustomState = undefined, CustomActionNames extends string = null> = {
    [name: string]: IRouterTemplate<CustomState, CustomActionNames>;
};
type iRouterTemplatesNoGenerics = IRouterTemplates;

/**
 * The template that defines a specific router type
 */
export interface IRouterTemplate<CustomState = undefined, CustomActionNames extends string = null> {
    actions: Actions<
        CustomActionNames,
        {template: IRouterTemplate<CustomState, CustomActionNames>},
        'template'
    >;
    reducer: RouterReducerFn<
        {template: IRouterTemplate<CustomState, CustomActionNames>},
        'template'
    >;
    config: IRouterTemplateConfig;
}
type iRouterTemplateTest = IRouterTemplate<{hello: true}, 'big' | 'blue'>;

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
    shouldParentTryToActivateSiblings?: boolean;
}

// type B<V> = V extends {[infer T]: any} ? T : undefined;
// type C = B<IRouterTemplateConfig>;
/**
 * The union of all router templates
 */
export type RouterTemplateUnion<T extends IRouterTemplates<unknown>> = T[keyof T];
// V = Pick<T, keyof T extends string ? null : keyof T >
// > = {
//     [RouterType in keyof V]: V[RouterType];
// }[keyof V] ;
type routerTemplateUnionTest = RouterTemplateUnion<DefaultTemplates & IRouterTemplates>;
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
export type ExtractCustomStateFromTemplate<
    T extends IRouterTemplate<unknown>
> = T extends IRouterTemplate<infer S> ? S : never;

type extractCustomStateFromTemplateTestUnions = ExtractCustomStateFromTemplate<
    RouterTemplateUnion<DefaultTemplates>
>;
type extractCustomStateFromTemplateMap = ExtractCustomStateFromTemplate<
    RouterTemplateUnion<AllTemplates>
>;

/**
 * Utility type for extracting custom action names from the actions defined in a template
 */
export type ExtractCustomActionNamesFromTemplate<
    T extends IRouterTemplate<unknown>
> = T extends IRouterTemplate<
    any, // eslint-disable-line
    infer A
>
    ? A
    : never;
// type extractCustomActionsFromTemplateTest = ExtractCustomActionNamesFromTemplate<DefaultTemplates['stack']>;

/**
 * -------------------------------------------------
 * Router state
 * -------------------------------------------------
 */

/**
 * The current router state.
 * Defined as an intersection of custom state defined in the templates and default state.
 */
export type RouterCurrentState<CustomState = undefined> = {
    visible: boolean;
    data?: CustomState;
};

type currentStateTestOne = RouterCurrentState;
type currentStateTestTwo = RouterCurrentState<string>;

/**
 * The historical state of a router.
 * Defined as an array of state objects with the smaller index being the more recent state
 */
export type RouterHistoricalState<CustomState> = RouterCurrentState<CustomState>[];

type routerHistoricalStateTest = RouterHistoricalState<string>;

export interface IRouterCurrentAndHistoricalState<CustomState> {
    current: RouterCurrentState<CustomState>;
    historical: RouterHistoricalState<CustomState>;
}

type routerCurrentAndHistoricalStateTest = IRouterCurrentAndHistoricalState<string>;

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
export interface IRouterDeclaration<Templates extends IRouterTemplates<unknown>> {
    name: string;
    routers?: Record<string, IRouterDeclaration<Templates>[]>;
    routeKey?: string;
    type?: NarrowRouterTypeName<keyof Templates>;
    parentName?: string;

    isPathRouter?: boolean;
    shouldInverselyActivate?: boolean; // TODO rename to canBeActivatedByNeighbors
    disableCaching?: boolean;
    defaultAction?: [string, RouterCustomStateFromTemplates<Templates>] | [];
}

/**
 * The arguments passed into a router constructor (by a manager) to initialize a router.
 */
export interface IRouterInitArgs<
    CustomTemplates extends IRouterTemplates<unknown>,
    RouterTypeName extends NarrowRouterTypeName<keyof AllTemplates<CustomTemplates>>
> {
    name: string;
    type: RouterTypeName;
    // manager: M;
    manager: IManager<CustomTemplates>;
    config: IRouterConfig<
        ExtractCustomStateFromTemplate<AllTemplates<CustomTemplates>[RouterTypeName]>
    >;
    parent?: Parent<CustomTemplates>;
    routers?: Childs<CustomTemplates>;
    root: Root<CustomTemplates>;
    getState?: () => IRouterCurrentAndHistoricalState<
        ExtractCustomStateFromTemplate<AllTemplates<CustomTemplates>[RouterTypeName]>
    >;
    subscribe?: (
        observer: Observer<
            ExtractCustomStateFromTemplate<AllTemplates<CustomTemplates>[RouterTypeName]>
        >
    ) => void;
    actions: (keyof AllTemplates<CustomTemplates>[RouterTypeName]['actions'])[]; // the router actions derived from the template. Usually 'show' and 'hide';
    // cache?: CacheClass<IRouterCache>;
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
    CustomTemplates extends IRouterTemplates<unknown>,
    RouterTypeName extends NarrowRouterTypeName<keyof AllTemplates<CustomTemplates>>
> {
    name: string;
    config: IRouterConfig<RouterCustomStateFromTemplates<AllTemplates<CustomTemplates>>>;
    type: RouterTypeName;
    parentName?: string;
}

/**
 * Computed information from the template default config and router declaration
 */
export interface IRouterConfig<CustomState> {
    routeKey: string;
    isPathRouter: boolean;
    shouldInverselyActivate: boolean;
    disableCaching: boolean; // optional b/c the default is to use the parents
    defaultAction: [string, CustomState] | [];
    shouldParentTryToActivateSiblings: boolean;
}

/**
 * -------------------------------------------------
 * Router Cache
 * -------------------------------------------------
 */

/**
 * The class type of a cache store instance
 */
export interface CacheClass<RouterCache extends IRouterCache<unknown>> {
    new (): RouterCache;
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
    CustomTemplates extends IRouterTemplates<unknown>,
    N extends NarrowRouterTypeName<keyof AllTemplates<CustomTemplates>>
> = Array<
    {
        [RouterType in Exclude<keyof AllTemplates<CustomTemplates>, N>]?: RouterInstance<
            CustomTemplates,
            NarrowRouterTypeName<RouterType>
        >;
    }[Exclude<keyof AllTemplates<CustomTemplates>, N>]
>;
type neighborsOfTypeTestScene = NeighborsOfType<DefaultTemplates, 'scene'>;
type neighborsOfTypeTestStack = NeighborsOfType<DefaultTemplates, 'data'>;

/**
 * -------------------------------------------------
 * Router utilities
 * -------------------------------------------------
 */

// /**
//  * Returns the union of all router children. This is useful when dynamically maping over
//  * children. For example Object.keys(router.routers)[routerType].map(<THIS TYPE> => ....)
//  */
// export type UnionOfChildren<T extends IRouterTemplates<unknown>> = {
//     [RouterType in keyof T]?: Array<RouterInstance<T, NarrowRouterTypeName<RouterType>>>;
// }[keyof T];

// type unionOfChildrenTest = UnionOfChildren<DefaultTemplates>;

// /**
//  * Utility to extract the template type of a router instance.
//  */
// // eslint-disable-next-line
// export type TemplateOfRouter<R> = R extends RouterInstance<
//     infer Templates,
//     infer Name // eslint-disable-line
// >
//     ? Templates[Name]
//     : never;

// type templateOfRouterTestAllRouters = RouterInstance<DefaultTemplates>;
// type templateOfRouterTestAllRoutersAllTemplates = TemplateOfRouter<templateOfRouterTestAllRouters>;
// type templateOfRouterTestStackRouter = RouterInstance<DefaultTemplates, 'stack'>;
// type templateOfRouterTestStackRouterTemplate = TemplateOfRouter<templateOfRouterTestStackRouter>;

/**
 * -------------------------------------------------
 * Manager
 * -------------------------------------------------
 */

/**
 * A decorator to apply to action functions when they are mixed into router classes.
 */
export type ActionWraperFnDecorator<
    CustomTemplates extends IRouterTemplates,
    Name extends NarrowRouterTypeName<keyof AllTemplates<CustomTemplates>>
> = (fn: RouterActionFn<CustomTemplates, Name>) => RouterActionFn<CustomTemplates, Name>;

/**
 * A map of all templates.
 * Custom templates are spread into the default templates allowing for overrides.
 */
export type AllTemplates<
    CustomTemplates extends IRouterTemplates<unknown> | null | unknown = null
> = CustomTemplates extends IRouterTemplates<unknown>
    ? Spread<DefaultTemplates, CustomTemplates>
    : DefaultTemplates;

type allTemplatesTestNoCustom = AllTemplates;
type allTemplatesTestNoCustomNull = AllTemplates<unknown>;
type allTemplatesTest = AllTemplates<{other: DefaultTemplates['stack']}>;
type allTemplatesTestSceneShow = allTemplatesTest['scene']['actions']['show'];
// type allTemplatesTestSceneCustomAction = allTemplatesTest['scene']['actions']['testAction'];
type allTemplatesTestOtherShow = allTemplatesTest['stack']['actions']['show'];
type allTemplatesTestStackToFront = allTemplatesTest['stack']['actions']['toFront'];
type allTemplatesTestStackReducer = allTemplatesTest['stack']['reducer'];

// type allTemplatesTestOtherShowError = allTemplatesTest['other']; // should error
// type allTemplatesTestInstance = RouterInstance<allTemplatesTest, 'scene'>['testAction'];

type allTemplatesTestOverride = AllTemplates<{scene: DefaultTemplates['stack']}>;
type allTemplatesTestOverrideSceneShow = allTemplatesTestOverride['scene'];
type allTemplatesTestOverrideInstanceSpecific = RouterInstance<
    allTemplatesTestOverride,
    'stack'
>['toFront'];
// should error out
// type allTemplatesTestOverrideInstanceSpecificError = RouterInstance<
//     allTemplatesTestOverride,
//     'scene'
// >['toFront'];
type allTemplatesTestOverrideInstanceAll = RouterInstance<allTemplatesTestOverride>['show'];

/**
 * Types associated with initializing the manager
 */
export interface IManagerInit<CustomTemplates extends IRouterTemplates<unknown>> {
    printTraceResults?: boolean;
    routerTree?: IRouterDeclaration<AllTemplates<CustomTemplates>>;
    serializedStateStore?: ISerializedStateStore;
    routerStateStore?: IRouterStateStore<
        RouterCustomStateFromTemplates<AllTemplates<CustomTemplates>>
    >;
    router?: RouterClass<
        CustomTemplates,
        NarrowRouterTypeName<keyof AllTemplates<CustomTemplates>>
        // IManager<CustomTemplates>
    >;
    customTemplates?: CustomTemplates;
    routerCacheClass?: CacheClass<
        IRouterCache<
            ExtractCustomStateFromTemplate<RouterTemplateUnion<AllTemplates<CustomTemplates>>>
        >
    >;
    cacheKey?: string;
    removeCacheAfterRehydration?: boolean;
}

/**
 * Returns a union of all custom state defined in the map of default and custom templates
 */
export type RouterCustomStateFromTemplates<
    Templates extends IRouterTemplates<unknown>
> = ExtractCustomStateFromTemplate<RouterTemplateUnion<Templates>>;

/**
 * Returns a union of all state defined in the map of default and custom templates
 */
export type RouterCurrentStateFromTemplates<
    Templates extends IRouterTemplates<unknown>
> = RouterCurrentState<ExtractCustomStateFromTemplate<RouterTemplateUnion<Templates>>>;

/**
 * The routers of a manager.
 * This type is a union of all possible router types found in the templates object.
 *
 */

// export type ManagerRouters<T extends IRouterTemplates<unknown>> = Record<
//     keyof T,
//     {
//         [RouterType in keyof T]: RouterInstance<T, NarrowRouterTypeName<RouterType>>;
//     }[keyof T]
// >[keyof T];
// RouterInstance<
//     T,
//     NarrowRouterTypeName<keyof T>
// >;

// type managerRoutersTestA = ManagerRouters<{other: DefaultTemplates['data']}>;
// type managerRoutersTestB = ManagerRouters<{other: DefaultTemplates['data']} & DefaultTemplates>;

// // type managerRoutersTestActionA = managerRoutersTestB['setData']; // <---- should error
// type managerRoutersTestActionB = managerRoutersTestB['show']; // <----- should not err

/**
 * The router types of a manager.
 * This type is a map of all possible router types found in the templates object. Each value
 * is a class that can be used to instantiate a specific router from a declaration object that a user supplies.
 */
// eslint-disable-next-line
export type ManagerRouterTypes<CustomTemplates extends IRouterTemplates<unknown>> = {
    [RouterType in keyof AllTemplates<CustomTemplates>]: RouterClass<
        CustomTemplates,
        NarrowRouterTypeName<RouterType>
    >;
};
// type managerRouterTypesTest<A extends IRouterTemplates<unknown>> = ManagerRouterTypes<
//     DefaultTemplates,
//     IManager<DefaultTemplates>
// >;

// type managerRouterTypesTestB<A extends IRouterTemplates<unknown>> = ManagerRouterTypes<
//     DefaultTemplates,
//     IManager<null>
// >;
type managerRouterTypesTest<A extends IRouterTemplates<unknown>> = ManagerRouterTypes<
    DefaultTemplates
    // IManager<DefaultTemplates>
>;

type managerRouterTypesTestB<A extends IRouterTemplates<unknown>> = ManagerRouterTypes<
    DefaultTemplates
    // IManager<null>
>;
// TODO FIX
type managerRouterTypesTestManager = managerRouterTypesTest<AllTemplates>['scene'];
// type managerRouterTypesTest = ManagerRouterTypes<
//     { otherType: DefaultTemplates['stack'] } & DefaultTemplates
// >;
// type managerRouterTypesTestA = managerRouterTypesTest['scene'];

/**
 * -------------------------------------------------
 * Serialized state store
 * -------------------------------------------------
 */
/**
 * An observer of the serialized state store.
 * For instance, with the BrowserSerializedState, an observer of that store
 * would be notified whenever the url changes
 */
export type StateObserver = (state: IOutputLocation) => any; // eslint-disable-line

/**
 * -------------------------------------------------
 * Router state store
 * -------------------------------------------------
 */

/**
 * The callback function that is passed through when a user subscribes to a specific router.
 */
export type Observer<CustomState> = (
    state: IRouterCurrentAndHistoricalState<CustomState>
) => unknown;

/**
 * A function created that can be used to register observer functions for a specific router that a manager oversees.
 */
export type RouterStateObserver<CustomState> = (fn: Observer<CustomState>) => void;

/**
 * An object representing all observers of routers keyed on router name
 */
export type RouterStateObservers<CustomState> = Record<string, Array<Observer<CustomState>>>;

/**
 * Configuration options that can be passed to a router state store
 */
export interface IRouterStateStoreConfig {
    historySize?: number;
}

/**
 * The store object of the router state store
 */
export type RouterStateStoreStore<CustomState> = Record<
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

// export type CustomTemplatesFromAllTemplates<Cust, All> = Pick<Cust, Diff<keyof Cust, keyof All>>;
// type SpreadDiffTest = CustomTemplatesFromAllTemplates<
//     AllTemplates<{test: AllTemplates['data']}>,
//     AllTemplates
// >;

// type RootAA = Root<AllTemplates<{test: AllTemplates['data']}>, 'root'>;
// type RootBB = Root<
//     AllTemplates<
//         CustomTemplatesFromAllTemplates<
//             {test: AllTemplates['data']},
//             AllTemplates<{test: AllTemplates['data']}>
//         >
//     >,
//     // AllTemplates<
//     //     Pick<
//     //         AllTemplates<CustomTemplates>,
//     //         Diff<
//     //             keyof AllTemplates<CustomTemplates>,
//     //             'scene' | 'stack' | 'data' | 'feature' | 'root'
//     //         >
//     //     >
//     // >,
//     'root'
// >;

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

// type KnownKeys<T> = {
//     [K in keyof T]: string extends K ? never : number extends K ? never : K
// } extends { [_ in keyof T]: infer U } ? U : never;

// type AA = KnownKeys<'hi' | 'hello' | string>

export type ValueOf<T extends object> = T[keyof T];
