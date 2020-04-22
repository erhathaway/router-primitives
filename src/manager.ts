import defaultRouterTemplates from './router_templates';
import {BrowserSerializedStore, NativeSerializedStore} from './serialized_state';
import {TracerSession} from './tracer';
import DefaultRouter from './router_base';
import DefaultRouterStateStore from './all_router_state';
import {objKeys} from './utilities';
import createActionExecutor from './action_executor';
import DefaultRouterCache from './all_router_cache';

import {IManager} from './types/manager';
import {
    ActionWraperFnDecorator,
    IInputLocation,
    IRouterCreationInfo,
    IRouterConfig,
    IRouterDeclaration,
    IRouterInitArgs,
    NarrowRouterTypeName,
    Root,
    ManagerRouterTypes,
    IManagerInit,
    RouterClass,
    IRouterTemplates,
    Constructable,
    RouterInstance,
    AllTemplates,
    RouterCustomStateFromTemplates,
    RouterCurrentStateFromTemplates,
    ExtractCustomStateFromTemplate,
    IRouterActionOptions,
    RouterTemplateUnion,
    ReducerContext
} from './types';
import {IRouterCache} from './types/router_cache';

/**
 * Create a RouterClass from a template. This occurs by mixing in the actions and reducer functions.
 */
const createRouterFromTemplate = <
    CustomTemplates extends IRouterTemplates<unknown>,
    RouterTypeName extends NarrowRouterTypeName<keyof AllTemplates<CustomTemplates>>,
    RC extends Constructable = Constructable
>(
    templateName: RouterTypeName,
    template: AllTemplates<CustomTemplates>[RouterTypeName],
    BaseRouter: RC,
    actionFnDecorator?: ActionWraperFnDecorator<CustomTemplates, RouterTypeName>,
    actionExecutorOptions?: {printerTracerResults?: boolean}
): RouterClass<CustomTemplates, RouterTypeName> => {
    const {actions, reducer} = template;

    const MixedInClass = class extends BaseRouter {
        // eslint-disable-next-line
        constructor(...args: any[]) {
            super(...args);

            // add actions to RouterType
            objKeys(actions).forEach(actionName => {
                Object.assign(this, {
                    [actionName]: createActionExecutor(
                        actions[actionName],
                        actionName,
                        actionFnDecorator as any, // eslint-disable-line
                        actionExecutorOptions
                    )
                });
            });

            // add reducer to RouterType
            Object.assign(this, {
                reducer
            });
        }
    };
    return (MixedInClass as unknown) as RouterClass<CustomTemplates, RouterTypeName>;
};

export default class Manager<CustomTemplates extends IRouterTemplates<unknown> = {}>
    implements IManager<CustomTemplates> {
    /**
     * A flag to control whether tracer results should be printed out to the console (console.log).
     * These results will appear after an action call (show, hide, etc...)
     */
    public printTracerResults: boolean;

    /**
     * A decorator that will be applied to each action function.
     * This is used by libraries like MobX to correctly bind to this lib when used.
     */
    public actionFnDecorator?: ActionWraperFnDecorator<CustomTemplates, any>; // eslint-disable-line

    /**
     * The tracer session store. When enabled, the tracer helps monitor performance and provide information about the steps taken during a router action (show, hide, etc...).
     */
    public tracerSession: TracerSession;

    /**
     * An internal pointer to instantiated routers. This allows libraries like MobX to correctly bind to this lib when used.
     */
    public _routers: Record<string, RouterInstance<CustomTemplates>>;

    /**
     * The root router instance
     */
    public rootRouter: Root<CustomTemplates>;

    /**
     * The serialized state store. When using the browserStore, this would be a wrapper around the URL and web History API
     */
    public serializedStateStore: IManagerInit<CustomTemplates>['serializedStateStore'];

    /**
     * The router state store. This stores the current and previous states of each router.
     */
    public routerStateStore: IManagerInit<CustomTemplates>['routerStateStore'];

    /**
     * The router classes that were created using the templates. These are used to create router instances.
     */
    public routerTypes: ManagerRouterTypes<CustomTemplates>;

    /**
     * The templates the manager was initialized with. These are used to create router classes.
     */
    public templates: AllTemplates<CustomTemplates>;

    /**
     * The router cache store
     */
    public routerCache: IRouterCache<
        ExtractCustomStateFromTemplate<RouterTemplateUnion<AllTemplates<CustomTemplates>>>
    >;

    /**
     * A count of how the number of actions (show, hide, etc..) that have occurred.
     */
    public actionCount: number;

    /**
     * The key the cache takes in the URL query params.
     */
    public cacheKey: string;

    /**
     * Flag to control removing the cache info from the url after it has been added to the router cache.
     */
    public removeCacheAfterRehydration: boolean;

    /**
     * A flag that is used to control what happens when a path action (show, hide, etc...) is missing data.
     * Either:
     * (A) Throw an error when a data dependent router is missing data
     * (B) Resolve to the nearest path short of the missing data router
     */
    public errorWhenMissingData: boolean;

    constructor(
        initArgs: IManagerInit<CustomTemplates> = {},
        {
            shouldInitialize,
            actionFnDecorator
        }: {
            shouldInitialize: boolean;
            actionFnDecorator?: ActionWraperFnDecorator<CustomTemplates, any>; // eslint-disable-line
        } = {
            shouldInitialize: true
        }
    ) {
        // used by mobx to decorate action fn
        if (actionFnDecorator) {
            this.actionFnDecorator = actionFnDecorator;
        }
        // pass all initArgs to this method so mobx decoration can work
        shouldInitialize && this.initializeManager(initArgs);
    }

    /**
     * Method to increment the action count.
     * This is called after each (show, hide, etc...).
     *
     * Router history is scoped to an action count number.
     * This provides an easy way for an individual router to know how its history relates to its siblings.
     */
    public incrementActionCount(): void {
        this.actionCount = (this.actionCount || 0) + 1;
    }

    /**
     * A method to instantiate the manager.
     * This is used instead of direct instantiation in the constructor to allow better compatibility to bindings that use MobX and such.
     */
    public initializeManager({
        routerDeclaration,
        serializedStateStore,
        routerStateStore,
        router,
        customTemplates,
        routerCacheClass,
        printTraceResults,
        cacheKey,
        removeCacheAfterRehydration,
        errorWhenMissingData
    }: IManagerInit<CustomTemplates>): void {
        this.actionCount = 0;

        this.printTracerResults = printTraceResults || false;
        this.cacheKey = cacheKey || '__cache';
        this.removeCacheAfterRehydration = removeCacheAfterRehydration || true;
        this.routerStateStore =
            routerStateStore ||
            new DefaultRouterStateStore<
                RouterCustomStateFromTemplates<AllTemplates<CustomTemplates>>
            >();

        // Check if a window object is present. If it is use the Browser serialized state store
        if (typeof window === 'undefined') {
            this.serializedStateStore = serializedStateStore || new NativeSerializedStore();
        } else {
            this.serializedStateStore = serializedStateStore || new BrowserSerializedStore();
        }

        if (routerCacheClass) {
            this.routerCache = new routerCacheClass();
        } else {
            this.routerCache = new DefaultRouterCache();
        }

        this.errorWhenMissingData = errorWhenMissingData || false;

        this.templates = ({
            ...defaultRouterTemplates,
            ...customTemplates
        } as unknown) as AllTemplates<CustomTemplates>; // TODO fix this nonsense

        // TODO implement
        // Manager.validateTemplates(templates);
        // validate all template names are unique
        // validation should make sure action names dont collide with any Router method names

        const BaseRouter = router || DefaultRouter;
        this.routerTypes = objKeys(this.templates).reduce((acc, templateName) => {
            const selectedTemplate = this.templates[templateName];

            // create router class from the template
            const RouterFromTemplate = createRouterFromTemplate(
                templateName,
                selectedTemplate,
                BaseRouter,
                this.actionFnDecorator,
                {printerTracerResults: this.printTracerResults}
            );

            // add new Router type to accumulator
            acc[templateName] = RouterFromTemplate;

            return {...acc};
        }, {} as ManagerRouterTypes<CustomTemplates>);

        // add initial routers
        this._routers = {};
        this.addRouters(routerDeclaration);

        // Subscribe to URL changes and update the router state when this happens.
        // The subject will notify the observer of its existing state.
        this.serializedStateStore.subscribeToStateChanges(this.setNewRouterState.bind(this));

        if (this.rootRouter) {
            // Replace the current location so the location at startup is a merge of the
            // existing location and default router actions
            this.rootRouter.show({replaceLocation: true});
        }
    }

    /**
     * Routers getter.
     */
    get routers(): Record<string, RouterInstance<CustomTemplates>> {
        return this._routers || {};
    }

    /**
     * Method to create URL links.
     */
    public linkTo = (
        routerName: string,
        actionName: string,
        actionArgs?: Omit<
            IRouterActionOptions<RouterCustomStateFromTemplates<AllTemplates<CustomTemplates>>>,
            'dryRun'
        >
    ): string => {
        const router = this.routers[routerName];
        if (!router) {
            throw new Error(`${routerName} router not found. Could not generate link`);
        }
        if (!actionName) {
            throw new Error(
                `actionName must be supplied. Use either 'show', 'hide' or a name custom to the router`
            );
        }

        // TODO change 'show' | 'hide' to union of actual actions
        const locationObj = router[actionName as 'show' | 'hide']({
            ...(actionArgs || {}),
            dryRun: true
        });

        return this.serializedStateStore.serializer(locationObj).location;
    };

    /**
     * Method to add the initial routers defined during initialization.
     */
    public addRouters = (
        router: IRouterDeclaration<AllTemplates<CustomTemplates>> = null,
        type: NarrowRouterTypeName<keyof AllTemplates<CustomTemplates>> = null,
        parentName: string = null
    ): void => {
        // If no router specified, there are no routers to add
        if (!router) {
            return;
        }

        // The type is derived by the relationship with the parent.
        //   Or has none, as is the case with the root router in essence
        //   Below, we are deriving the type and calling the add function recursively by type
        this.addRouter({...router, type, parentName});
        const childRouters = router.children || {};
        objKeys(childRouters).forEach(childType => {
            childRouters[childType].forEach(child =>
                this.addRouters(
                    child,
                    childType as NarrowRouterTypeName<keyof AllTemplates<CustomTemplates>>,
                    router.name
                )
            );
        });
    };

    /**
     * High level method for adding a router to the router state tree based on an input router declaration object.
     *
     * This method will add the router to the manager and correctly associate the router with
     * its parent and any child routers.
     */
    public addRouter(routerDeclaration: IRouterDeclaration<AllTemplates<CustomTemplates>>): void {
        const {name, parentName, type} = routerDeclaration;
        const parent = this.routers[parentName];

        // Set the root router type if the router has no parent
        const routerType = (!parentName && !this.rootRouter
            ? 'root'
            : type) as NarrowRouterTypeName<keyof AllTemplates<CustomTemplates>>;
        const config = this.createRouterConfigArgs(routerDeclaration, routerType, parent);

        // Create a router
        const router = this.createRouter({name, config, type: routerType, parentName});

        // Set the created router as the parent router.
        // If it has no parent and there is not yet a root.
        if (!parentName && !this.rootRouter) {
            // Narrow router type to the root router type
            this.rootRouter = router as Root<CustomTemplates>;
        } else if (!parentName && this.rootRouter) {
            throw new Error(
                'Root router already exists. You likely forgot to specify a parentName'
            );
        }

        if (parent) {
            // Fetch the parent, and assign a ref of it to this router
            router.parent = parent;

            // Add ref of new router to the parent
            const siblingTypes = parent.children[type] || [];
            siblingTypes.push(router);
            parent.children[type] = siblingTypes;
        }

        // Add ref of new router to manager
        this.registerRouter(name, router);

        if (router.isPathRouter) {
            this.validateNeighborsOfOtherTypesArentPathRouters(router);
        }
    }

    /**
     * Method to remove a router from the routing tree, manager, and delete all links to it in other routers.
     * Removing a router will also remove all of its children
     */
    public removeRouter = (name: string): void => {
        const router = this.routers[name];
        const {parent, children, type} = router;

        // Delete the reference to this router the parent has.
        if (parent) {
            const routersToKeep = parent.children[type].filter(child => child.name !== name);
            parent.children[type] = routersToKeep;
        }

        // Delete all children routers by recursively calling this method.
        const childrenTypes = objKeys(children);
        childrenTypes.forEach(childType => {
            children[childType].forEach(childRouter => this.removeRouter(childRouter.name));
        });

        // Remove router related state subscribers.
        this.routerStateStore.unsubscribeAllObserversForRouter(name);

        // Delete ref the manager stores.
        this.unregisterRouter(name);
    };

    /**
     * Add a newly instantiated router to the registry of instantiated routers.
     */
    public registerRouter(name: string, router: RouterInstance<CustomTemplates>): void {
        this._routers[name] = router;
    }

    /**
     * Removes an instantiated router from the registry of instantiated routers.
     */
    public unregisterRouter(name: string): void {
        delete this._routers[name];
    }

    /**
     * Calculate and store the state of each router in the tree from the input location.
     */
    public calcNewRouterState<
        Name extends NarrowRouterTypeName<keyof AllTemplates<CustomTemplates>>
    >(
        location: IInputLocation,
        router: RouterInstance<CustomTemplates, NarrowRouterTypeName<Name>>,
        ctx: ReducerContext<CustomTemplates, Name> = {},
        newState: Record<
            string,
            RouterCurrentStateFromTemplates<AllTemplates<CustomTemplates>>
        > = {}
    ): Record<string, RouterCurrentStateFromTemplates<AllTemplates<CustomTemplates>>> {
        if (!router) {
            return;
        }

        // Call the routers reducer to calculate its state from the new location
        const currentRouterState = router.reducer(location, router, ctx);
        const actionCount = {actionCount: this.actionCount};

        // Recursively call all children to add their state to the `newState` object
        return objKeys(router.children).reduce(
            (acc, type) => {
                const newStatesForType = router.children[type].reduce((accc, childRouter) => {
                    const state = this.calcNewRouterState(location, childRouter, ctx, accc);
                    return {...acc, ...state};
                }, acc);
                return {...acc, ...newStatesForType};
            },
            {...newState, [router.name]: {...currentRouterState, ...actionCount}}
        );
    }

    /**
     * Create config used during instantiation of a router based on a router declaration object and the template.
     * This is used internally by the `addRouter` method.
     */
    public createRouterConfigArgs<
        Name extends NarrowRouterTypeName<keyof AllTemplates<CustomTemplates>>
    >(
        routerDeclaration: IRouterDeclaration<AllTemplates<CustomTemplates>>,
        routerType: Name,
        parent: RouterInstance<CustomTemplates, Name>
    ): IRouterConfig<RouterCustomStateFromTemplates<AllTemplates<CustomTemplates>>> {
        const templateConfig = this.templates[routerType].config;
        const hasParentOrIsRoot =
            parent && parent.isPathRouter !== undefined ? parent.isPathRouter : true;
        const isSetToBePathRouter =
            routerDeclaration.isPathRouter !== undefined
                ? routerDeclaration.isPathRouter
                : templateConfig.isPathRouter || false;
        const shouldParentTryToActivateNeighbors =
            routerDeclaration.shouldInverselyActivate !== undefined
                ? routerDeclaration.shouldInverselyActivate
                : templateConfig.shouldInverselyActivate || true;
        const isSetToDisableCaching =
            routerDeclaration.disableCaching !== undefined
                ? routerDeclaration.disableCaching
                : templateConfig.disableCaching;
        const shouldParentTryToActivateSiblings =
            templateConfig.shouldParentTryToActivateSiblings || true;
        const isDependentOnExternalData = templateConfig.isDependentOnExternalData || false;

        return {
            routeKey: routerDeclaration.routeKey || routerDeclaration.name,
            isPathRouter:
                templateConfig.canBePathRouter && hasParentOrIsRoot && isSetToBePathRouter,
            shouldInverselyActivate: shouldParentTryToActivateNeighbors,
            disableCaching: isSetToDisableCaching,
            defaultAction: routerDeclaration.defaultAction || [],
            shouldParentTryToActivateSiblings,
            isDependentOnExternalData
        };
    }

    public validateNeighborsOfOtherTypesArentPathRouters<
        Name extends NarrowRouterTypeName<keyof AllTemplates<CustomTemplates>>
    >(router: RouterInstance<CustomTemplates, Name>): void {
        const nameOfNeighborRouterThatIsPathRouter = router
            .getNeighbors()
            .reduce((acc, r) => (r.isPathRouter ? r.name : acc), undefined);
        if (nameOfNeighborRouterThatIsPathRouter) {
            throw new Error(
                `Cannot add ${router.name}. 
                This router is supposed to be a path router but a neighbor (${nameOfNeighborRouterThatIsPathRouter} is already a path router.
                In order to make the router state tree deterministic only one type of neighbor should have isPathRouter set to true. 
                To get rid of this error either use a different router type or set on neighbor router type to isPathRouter to false `
            );
        }
    }

    /**
     * Validate that the config info derived from the router declaration object is valid.
     * Among other things, this checks that the router name and router routeKey are unique.
     */
    public validateRouterCreationInfo<
        Name extends NarrowRouterTypeName<keyof AllTemplates<CustomTemplates>>
    >(
        name: string,
        type: Name,
        config: IRouterConfig<RouterCustomStateFromTemplates<AllTemplates<CustomTemplates>>>
    ): void {
        // Check if the router type exists.
        if (!this.routerTypes[type] && type !== 'root') {
            throw new Error(
                `The router type ${type} for router '${name}' does not exist. Consider creating a template for this type.`
            );
        }

        // Check to make sure a router with the same name hasn't already been added.
        if (this.routers[name]) {
            throw new Error(`A router with the name '${name}' already exists.`);
        }

        // Check if the router routeKey is unique.
        const routeKeyAlreadyExists = Object.values(this.routers).reduce((acc, r) => {
            return acc || r.routeKey === config.routeKey;
        }, false);

        if (routeKeyAlreadyExists) {
            throw new Error(`A router with the routeKey '${config.routeKey}' already exists`);
        }
    }

    /**
     * Create args that match the input signature of the router class constructor.
     *
     * This method is overridden by libraries like `router-primitives-mobx` as it is a convenient
     * place to redefine getters and setters, such as`getState` and `subscribe`
     */
    public createNewRouterInitArgs<
        Name extends NarrowRouterTypeName<keyof AllTemplates<CustomTemplates>>
    >({
        name,
        config,
        type,
        parentName
    }: IRouterCreationInfo<CustomTemplates, NarrowRouterTypeName<Name>>): IRouterInitArgs<
        CustomTemplates,
        NarrowRouterTypeName<Name>
    > {
        const parent = this.routers[parentName];
        const actions = objKeys(this.templates[type].actions);

        return {
            name,
            config: {...config},
            type,
            parent,
            children: {},
            // TODO fix this type
            // CustomTemplatesFromAllTemplates should overlap with CustomTemplates
            // IManager<CustomTemplates> should work and not need a casting to `unknown`
            manager: (this as unknown) as IManager<CustomTemplates>,
            root: this.rootRouter,
            getState: this.routerStateStore.createRouterStateGetter(name),
            subscribe: this.routerStateStore.createRouterStateSubscriber(name),
            actions
        };
    }

    /**
     * Create a router instance.
     *
     * Redefined by libraries like `router-primitives-mobx`.
     * Good place to change the base router prototype or decorate methods
     */
    public createRouterFromInitArgs<
        Name extends NarrowRouterTypeName<keyof AllTemplates<CustomTemplates>>
    >(
        initalArgs: IRouterInitArgs<CustomTemplates, NarrowRouterTypeName<Name>>
    ): RouterInstance<CustomTemplates, NarrowRouterTypeName<Name>> {
        const routerClass = this.routerTypes[initalArgs.type];

        return new routerClass({...initalArgs});
    }

    /**
     * Set the router cache from cache info stored in the query params.
     * This is used to rehydrate the location from cache.
     * For example, if you pasted in a URL with cache info, this would add it to the cache store.
     */
    public setCacheFromLocation = (location: IInputLocation): void => {
        if (location.search[this.cacheKey]) {
            this.routerCache.setCacheFromSerialized(location.search[this.cacheKey] as string);
        }
    };

    /**
     * Removes cache info from the query params of the location object.
     */
    public removeCacheFromLocation = (existingLocation: IInputLocation): void => {
        const newLocation = JSON.parse(JSON.stringify({...existingLocation}));
        newLocation.search[this.cacheKey] = undefined;

        this.serializedStateStore.setState({
            ...newLocation,
            options: {...newLocation.options, replaceLocation: true}
        });
    };

    /**
     * Given a location change, set the new router state tree state.
     * new location -> new state
     *
     * The method `calcNewRouterState` will recursively walk down the tree calling each
     * routers reducer to calculate the state.
     *
     * Once the state of the entire tree is calculate, it is stored in a central store,
     * the `routerStateStore`
     */
    public setNewRouterState(location: IInputLocation): void {
        this.setCacheFromLocation(location);

        // Replaces current location in the serialized state store.
        // In turn, this will trigger a new state change cascade and re-trigger this method without
        // cache in the location
        this.setCacheFromLocation(location);
        if (this.removeCacheAfterRehydration && location.search[this.cacheKey] !== undefined) {
            return this.removeCacheFromLocation(location);
        }

        if (!this.rootRouter) {
            return;
        }

        this.incrementActionCount();

        const newState = this.calcNewRouterState(
            location,
            this.rootRouter as RouterInstance<CustomTemplates>
        );

        this.routerStateStore.setState(newState);
    }

    /**
     * Method for creating a router.
     * Routers created with this method aren't added to the manager and are missing connections to parent and child routers
     *
     * To correctly add a router such that it can be managed by the manager and has
     * parent and child router connections, use one of the `add` methods on the manager.
     * Those methods use this `createRouter` method internally.
     */
    public createRouter<Name extends NarrowRouterTypeName<keyof AllTemplates<CustomTemplates>>>({
        name,
        config,
        type,
        parentName
    }: IRouterCreationInfo<CustomTemplates, NarrowRouterTypeName<Name>>): RouterInstance<
        CustomTemplates,
        Name
    > {
        this.validateRouterCreationInfo(name, type, config);

        const initalArgs = this.createNewRouterInitArgs({name, config, type, parentName});
        return this.createRouterFromInitArgs({...initalArgs});
    }
}

/**
 * Code to sanity check manager instantiation and various types that are part of the public API.
 *
 * Comment out this code when you are done with it.
 */
// const manager = new Manager<{jsonRouter: DefaultTemplates['data']}>({});
// const myRouter = manager.routers['my_router']; // a union of all routers
// const myRouterState = myRouter.state; // a union of all states
// const myRouterReducer = myRouter.reducer;
// const myRouterActions = myRouter.show;

// const myRouterChildrenStack = myRouter.routers.stack[0];
// const myRouterChildrenStackAction = myRouterChildrenStack.toFront;
// const myRouterChildrenStackReducer = myRouterChildrenStack.reducer;
// const myRouterChildrenStackState = myRouterChildrenStack.state;
// const myRouterChildrenStackManager = myRouterChildrenStack.manager;
// const myRouterChildrenStackSiblings = myRouterChildrenStack.siblings;
// const myRouterChildrenStackNeighbors = myRouterChildrenStack.getNeighbors();

// const myRouterChildrenJsonRouter = myRouter.routers.jsonRouter[0];
// const myRouterChildrenJsonRouterAction = myRouterChildrenJsonRouter.setData;
// const myRouterChildrenJsonRouterReducer = myRouterChildrenJsonRouter.reducer;
// const myRouterChildrenJsonRouterState = myRouterChildrenJsonRouter.state;
// const myRouterChildrenJsonRouterManager = myRouterChildrenJsonRouter.manager;
// const myRouterChildrenJsonRouterSiblings = myRouterChildrenJsonRouter.siblings;
// const myRouterChildrenJsonRouterNeighbors = myRouterChildrenJsonRouter.getNeighbors();
// const myRouterChildrenJsonRouterType = myRouterChildrenJsonRouter.type;
// const myRouterChildrenJsonRouterName = myRouterChildrenJsonRouter.name;
// const myRouterChildrenJsonRouterHistory = myRouterChildrenJsonRouter.history;
// const myRouterChildrenJsonRouterSubscribe = myRouterChildrenJsonRouter.subscribe;

// const root = manager.rootRouter;
// const rootAction = root.show;
// const rootReducer = root.reducer;
// const rootState = root.state;

// const jsonRouterClass = manager.routerTypes.jsonRouter;
// const jsonRouterInstance = new jsonRouterClass({} as any);
// const jsonRouterInstanceAction = jsonRouterInstance.setData;
// const jsonRouterInstanceReducer = jsonRouterInstance.reducer;
// const jsonRouterInstanceState = jsonRouterInstance.state;
// const jsonRouterInstanceSiblings = jsonRouterInstance.siblings;

// const stackRouterClass = manager.routerTypes.stack;
// const stackRouterInstance = new stackRouterClass({} as any);
// const stackRouterInstanceAction = stackRouterInstance.toBack;
// const stackRouterInstanceReducer = stackRouterInstance.reducer;
// const stackRouterInstanceState = stackRouterInstance.state;
// const stackRouterInstanceReducedState = stackRouterInstance.reducer(
//     'a' as any,
//     'b' as any,
//     'c' as any
// );
// const stackRouterInstanceSiblings = stackRouterInstance.siblings;
