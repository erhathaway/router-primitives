import {TracerSession} from '../tracer';
import {
    ActionWraperFnDecorator,
    IInputLocation,
    ILocationActionContext,
    IRouterCreationInfo,
    IRouterConfig,
    IRouterDeclaration,
    IRouterInitArgs,
    NarrowRouterTypeName,
    Root,
    ManagerRouterTypes,
    IManagerInit,
    IRouterTemplates,
    // ManagerRouters,
    RouterInstance,
    AllTemplates,
    RouterCurrentStateFromTemplates,
    RouterCustomStateFromTemplates
} from '../types';
import {DefaultTemplates} from './router_templates';
import {IRouterCache} from './router_cache';

export interface IManager<CustomTemplates extends IRouterTemplates<unknown> = null> {
    actionFnDecorator?: ActionWraperFnDecorator<CustomTemplates, any>;
    tracerSession: TracerSession;
    rootRouter: Root<CustomTemplates>;
    serializedStateStore: IManagerInit<CustomTemplates>['serializedStateStore'];
    routerStateStore: IManagerInit<CustomTemplates>['routerStateStore'];
    routerTypes: ManagerRouterTypes<CustomTemplates>;
    templates: AllTemplates<CustomTemplates>;
    routers: Record<string, RouterInstance<CustomTemplates>>;
    routerCache: IRouterCache<RouterCustomStateFromTemplates<AllTemplates<CustomTemplates>>>;
    actionCount: number;
    cacheKey: string;
    removeCacheAfterRehydration: boolean;

    incrementActionCount: () => void;
    /**
     * Adds the initial routers defined during initialization
     */
    addRouters: (
        router: IRouterDeclaration<AllTemplates<CustomTemplates>>,
        type: NarrowRouterTypeName<keyof AllTemplates<CustomTemplates>>,
        parentName: string
    ) => void;

    /**
     * High level method for adding a router to the router state tree based on an input router declaration object
     *
     * This method will add the router to the manager and correctly associate the router with
     * its parent and any child routers
     */
    addRouter: (routerDeclaration: IRouterDeclaration<AllTemplates<CustomTemplates>>) => void;

    /**
     * Remove a router from the routing tree and manager
     * Removing a router will also remove all of its children
     */
    removeRouter: (name: string) => void;

    registerRouter: (name: string, router: RouterInstance<CustomTemplates>) => void;

    unregisterRouter: (name: string) => void;

    calcNewRouterState: <Name extends NarrowRouterTypeName<keyof AllTemplates<CustomTemplates>>>(
        location: IInputLocation,
        router: RouterInstance<CustomTemplates, Name>,
        ctx: Omit<ILocationActionContext<CustomTemplates, Name>, 'actionName'>,
        // TODO fill in current state's custom state generic from the above router
        newState: Record<string, RouterCurrentStateFromTemplates<AllTemplates<CustomTemplates>>>
    ) => Record<string, RouterCurrentStateFromTemplates<AllTemplates<CustomTemplates>>>;

    createRouterConfigArgs: <
        Name extends NarrowRouterTypeName<keyof AllTemplates<CustomTemplates>>
    >(
        routerDeclaration: IRouterDeclaration<AllTemplates<CustomTemplates>>,
        routerType: Name,
        parent: RouterInstance<CustomTemplates, Name>
    ) => IRouterConfig<RouterCustomStateFromTemplates<AllTemplates<CustomTemplates>>>;

    validateNeighborsOfOtherTypesArentPathRouters: <
        Name extends NarrowRouterTypeName<keyof AllTemplates<CustomTemplates>>
    >(
        router: RouterInstance<CustomTemplates, Name>
    ) => void;

    validateRouterCreationInfo: <
        Name extends NarrowRouterTypeName<keyof AllTemplates<CustomTemplates>>
    >(
        name: string,
        type: Name,
        config: IRouterConfig<RouterCustomStateFromTemplates<AllTemplates<CustomTemplates>>>
    ) => void;

    /**
     *
     * Creates the arguments that the router object constructor expects
     *
     * This method is overridden by libraries like `router-primitives-mobx` as it is a convenient
     * place to redefine the getters and setters `getState` and `subscribe`
     */
    createNewRouterInitArgs: <
        Name extends NarrowRouterTypeName<keyof AllTemplates<CustomTemplates>>
        // M extends Manager
    >({
        name,
        config,
        type,
        parentName
    }: IRouterCreationInfo<CustomTemplates, NarrowRouterTypeName<Name>>) => IRouterInitArgs<
        CustomTemplates,
        NarrowRouterTypeName<Name>
        // IManager<CustomTemplates>
    >;
    /**
     * Create a router instance
     *
     * Redefined by libraries like `router-primitives-mobx`.
     * Good place to change the base router prototype or decorate methods
     */
    createRouterFromInitArgs: <
        Name extends NarrowRouterTypeName<keyof AllTemplates<CustomTemplates>>
    >(
        initalArgs: IRouterInitArgs<CustomTemplates, NarrowRouterTypeName<Name>>
    ) => RouterInstance<CustomTemplates, NarrowRouterTypeName<Name>>;

    /**
     * Given a location change, set the new router state tree state
     * AKA:new location -> new state
     *
     * The method `calcNewRouterState` will recursively walk down the tree calling each
     * routers reducer to calculate the state
     *
     * Once the state of the entire tree is calculate, it is stored in a central store,
     * the `routerStateStore`
     */
    setNewRouterState: (location: IInputLocation) => void;

    /**
     * Method for creating a router. Routers created with this method
     * aren't added to the manager and are missing connections to parent and child routers
     *
     * To correctly add a router such that it can be managed by the manager and has
     * parent and child router connections, use one of the `add` methods on the manager.
     * Those methods use this `createRouter` method in turn.
     */
    createRouter: <Name extends NarrowRouterTypeName<keyof AllTemplates<CustomTemplates>>>({
        name,
        config,
        type,
        parentName
    }: IRouterCreationInfo<CustomTemplates, NarrowRouterTypeName<Name>>) => RouterInstance<
        CustomTemplates,
        Name
    >;
}

type IManagerTestA = IManager<{custom: DefaultTemplates['stack']}>;
type A = IManagerTestA['routerTypes'];

type IManagerTestB = IManager;
type B = IManagerTestB['routerTypes'];
