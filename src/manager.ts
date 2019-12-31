import routerTemplates from './router/template';

import {BrowserSerializedStore, NativeSerializedStore} from './serializedState';
import {ITracerThing, TracerSession, tracerManager} from './tracer';
import {
    ActionWraperFn,
    ActionWraperFnDecorator,
    IInputLocation,
    ILocationActionContext,
    IOutputLocation,
    IRouterActionOptions,
    IRouterCreationInfo,
    IRouterConfig,
    IRouterDeclaration,
    IRouterInitArgs,
    RouterAction,
    IManagerInit,
    RouterClass,
    IRouterTemplate,
    IRouterTemplates,
    IRouterCurrentState,
    Constructable,
    RouterInstance,
    RouterCurrentState
} from './types';

import DefaultRouter from './router/base';
import DefaultRouterStateStore from './routerState';
import RouterBase from './router/base';

const capitalize = (name = ''): string => name.charAt(0).toUpperCase() + name.slice(1);

// extend router base for specific type
const createRouterFromTemplate = <
    CustomState extends {},
    T extends Constructable,
    Template extends IRouterTemplate,
    TemplateName,
    Actions extends Record<string, RouterAction> = Template['actions'],
    ActionNames extends string = Extract<keyof Template['actions'], 'string'>
>(
    BaseRouter: T,
    templateName: TemplateName,
    template: Template,
    actionWraperFn: (
        actionFn: RouterAction,
        actionName: string
    ) => ActionWraperFn<
        ActionNames,
        CustomState,
        RouterInstance<ActionNames, CustomState, RouterBase>
    >
): RouterClass<Extract<keyof Actions, 'string'>, CustomState, typeof BaseRouter> => {
    const {actions, reducer} = template;

    const MixedInClass = class extends BaseRouter {
        // change the router name to include the type

        name = `${capitalize(templateName.toString())}Router`;

        // eslint-disable-next-line
        constructor(...args: any[]) {
            super(...args);
            // add actions to RouterType
            (Object.keys(actions) as ['show']).forEach(actionName => {
                Object.assign(this, {
                    [actionName]: actionWraperFn(actions[actionName], actionName)
                });
            });

            // add reducer to RouterType
            Object.assign(this, {
                reducer
            });
        }
    };
    return (MixedInClass as unknown) as RouterClass<ActionNames, CustomState, typeof BaseRouter>;
};

export default class Manager<
    CustomState extends {} = {},
    CustomTemplates extends IRouterTemplates<RouterCurrentState<CustomState>> = {},
    DefaultTemplates extends IRouterTemplates<
        RouterCurrentState<CustomState>
    > = typeof routerTemplates,
    RouterTypeNames extends keyof CustomTemplates & DefaultTemplates = keyof CustomTemplates &
        DefaultTemplates,
    Actions extends Record<string, RouterAction> = {
        [actionName in keyof (CustomTemplates &
            DefaultTemplates)[RouterTypeNames]['actions']]: (CustomTemplates &
            DefaultTemplates)[RouterTypeNames]['actions'][actionName];
    },
    ActionNames extends string = Extract<keyof Actions, 'string'>
> {
    public actionFnDecorator?: ActionWraperFnDecorator;
    public tracerSession: TracerSession;
    public _routers: Record<string, RouterInstance<ActionNames, RouterCurrentState>> = {};
    public rootRouter: RouterClass<ActionNames, RouterCurrentState> = undefined;
    public serializedStateStore: IManagerInit['serializedStateStore'];
    public routerStateStore: IManagerInit['routerStateStore'];
    public routerTypes: {
        [routerTypeName in RouterTypeNames]: RouterClass<ActionNames, RouterCurrentState>;
    };
    public templates: CustomTemplates & DefaultTemplates;

    constructor(
        initArgs: IManagerInit<CustomTemplates, DefaultTemplates> = {},
        {
            shouldInitialize,
            actionFnDecorator
        }: {shouldInitialize: boolean; actionFnDecorator?: ActionWraperFnDecorator} = {
            shouldInitialize: true
        }
    ) {
        shouldInitialize && this.initializeManager(initArgs);
        if (actionFnDecorator) {
            this.actionFnDecorator = actionFnDecorator;
        }
    }

    public setChildrenDefaults = (
        options: IRouterActionOptions,
        location: IInputLocation,
        router: RouterInstance<ActionNames, RouterCurrentState>,
        ctx: ILocationActionContext
    ): IInputLocation => {
        const tracerSession = router.manager.tracerSession;
        const tracer = tracerSession.tracerThing(router.name);

        let newLocation = {...location};
        // TODO don't mutate location
        // console.log(
        // tracer.logStep('Found number of children types', Object.keys(router.routers).length)
        Object.keys(router.routers).forEach(routerType => {
            // skip routers that called the parent router
            if (routerType === ctx.activatedByChildType) {
                tracer.logStep(
                    `Not calling child router type: ${routerType} b/c it is the same type of activation origin`
                );
                // console.log(`Not calling router b/c same type of active child`)

                return;
            }

            router.routers[routerType].forEach(child => {
                const childTracer = tracerSession.tracerThing(child.name);

                // prevent inverse activation if it is turned off
                if (ctx.callDirection === 'up' && child.config.shouldInverselyActivate === false) {
                    // console.log(`Not calling router b/c not inversely active: ${child.name}`)
                    childTracer.logStep(
                        `Not calling child router b/c it is not inversely active: ${child.name}`
                    );
                    return;
                }

                const newContext: ILocationActionContext = {
                    ...ctx,
                    addingDefaults: true,
                    activatedByChildType: undefined,
                    callDirection: 'down'
                }; // TODO check if it makes sense to move addingDefaults to options

                // if the cached visibility state is 'false' don't show on rehydration
                // if (child.cache.wasVisible === false) {
                //     console.log(`Not calling router b/c has no cache indicating previous visibility: ${child.name}`)

                //     // return;
                //     if (child.config.defaultAction && child.config.defaultAction.length > 0) {
                //         const [action, ...args] = child.config.defaultAction;
                //         console.log(`Applying default action: ${action} for ${child.name}`)

                //         newLocation = (child as any)[action](
                //             { ...options, data: args[0] }, // TODO pass more than just the first arg
                //             newLocation,
                //             child,
                //             newContext
                //         );
                //     }
                // }

                // if there is a cache state, show the router
                if (child.cache.wasVisible === true) {
                    // the cache has been 'used' so remove it
                    child.cache.removeCache();
                    tracer.logStep(
                        `Calling show action of child router b/c it has a cached previous visibility: ${child.name}`
                    );

                    newLocation = child.show(options, newLocation, child, newContext);
                }

                // if the cached visibility state is 'false' don't show on rehydration
                // or if there is no cache state and there is a default action, apply the action
                else if (child.config.defaultAction && child.config.defaultAction.length > 0) {
                    const [action, ...args] = child.config.defaultAction;
                    tracer.logStep(`(Applying default action: ${action} for ${child.name}`);

                    newLocation = (child as any)[action](
                        {...options, data: args[0]}, // TODO pass more than just the first arg
                        newLocation,
                        child,
                        newContext
                    );
                }
            });
        });

        return newLocation;
    };

    /**
     * Called when a router's 'hide' action is called directly or the
     * parent's 'hide' action is called.
     *
     * 1. Calculate whether caching is enabled by looking at explicit settings or defaulting to
     * the parents `disableCaching` status
     * 2. Hide child routers that are visible and pass along the current `disableCaching` status
     * 3. If caching is enabled, store a record that the router was previously visible
     *
     * TODO: dont mutate location state
     */
    public setCacheAndHide = (
        options: IRouterActionOptions,
        location: IInputLocation,
        router: InstanceType<RouterClass<Actions, RouterCurrentState>>,
        ctx: ILocationActionContext = {}
    ): IInputLocation => {
        const tracerSession = router.manager.tracerSession;
        const tracer = tracerSession.tracerThing(router.name);

        let newLocation = location;
        let disableCaching: boolean | undefined;

        // Figure out if caching should occur:
        // If the user hasn't set anything, we should fall back to the
        // context object and inherit the setting from the parent.
        // If the parent hasn't set a setting we are probably at root of the action call
        // and should fall back to using the template.
        if (router.config.disableCaching !== undefined) {
            disableCaching = router.config.disableCaching;
        } else {
            disableCaching =
                ctx.disableCaching || router.lastDefinedParentsDisableChildCacheState || false;
        }
        tracer.logStep('setting', {disableCaching});

        Object.keys(router.routers).forEach(routerType => {
            router.routers[routerType].forEach(child => {
                // Update ctx object's caching setting for this branch of the router tree
                const newCtx = {...ctx, disableCaching};

                // Call location 'hide' action if the child is visible
                const childTracer = tracerSession.tracerThing(child.name);
                childTracer.logStep('Looking at child');

                if (child.state.visible) {
                    childTracer.logStep('Calling `hide` action');
                    // console.log(`Hiding router: ${child.name}`)
                    newLocation = child.hide({}, newLocation, child, newCtx);
                } else {
                    childTracer.logStep('Not calling child b/c its hidden already');
                }
            });
        });

        // The `options.disableCaching` gives the caller of the direct action
        // the ability to disable caching on a case by case basis will interacting
        // with the router tree. We only want `options.disableCaching` to affect the immediate
        // router. If we want to disable caching for all routers use the ctx object
        // For example, `scene` routers use the `options.disableCaching` to disable sibling caches
        // so they don't get reshown when a parent causes a rehydration
        const shouldCache = !disableCaching && !(options.disableCaching || false);
        tracer.logStep('setting', {shouldCache});

        // console.log(`SHOULD CACHE: ${router.name}`, shouldCache, disableCaching, options.disableCaching)
        if (shouldCache) {
            // console.log(`Cache: storing was previously visible for router: ${router.name}`)
            router.cache.setWasPreviouslyVisibleToFromLocation(newLocation, router);
        }

        return newLocation;
    };

    /**
     * Decorator around the `action` methods of a router.
     * Called every time an action is called.
     *
     * Common tasks are caching current router state, setting any default state,
     * and changing visibility in response to a parent or sibling action
     *
     * @param actionFn a router action function (RouterAction) that returns a location object (`IInputLocation`)
     * @param actionName name of the action. Usually `show` or `hide` but can be any custom action defined in a template
     *
     */
    public createActionWrapperFunction = <
        A extends string = string,
        C extends {} = {},
        B extends RouterBase = RouterBase,
        Fn extends ActionWraperFn<A, C, B> = ActionWraperFn<A, C, B>
    >(
        actionFn: RouterAction,
        actionName: string
    ): Fn => {
        function actionWrapper(
            options: IRouterActionOptions = {},
            existingLocation?: IOutputLocation,
            routerInstance: InstanceType<RouterClass<Actions, RouterCurrentState>> = this,
            ctx: ILocationActionContext = {}
        ): IInputLocation {
            if (!existingLocation) {
                if (routerInstance.manager.tracerSession) {
                    routerInstance.manager.tracerSession.end();
                    routerInstance.manager.tracerSession.removeAllSubscriptions();
                    // routerInstance.manager.tracerSession.manager._moveSessionToFinishedStorage(routerInstance.manager.tracerSession)
                    // console.log('---------------------'); // tslint:disable-line
                }
                routerInstance.manager.tracerSession = tracerManager.newSession('Action started');
                Object.keys(routerInstance.manager.routers).forEach(routerName => {
                    const r = routerInstance.manager.routers[routerName];
                    const tracerUpdateFn = (thingInfo: ITracerThing): void => {
                        // const lastStep = thingInfo.steps[thingInfo.steps.length - 1];
                        // console.log(`(${thingInfo.name}):`);

                        // console.log('....', lastStep && lastStep.name);
                        r.EXPERIMENTAL_setInternalState({...thingInfo});
                        // (currentInfo: IInternalState) => ({
                        //     ...currentInfo,
                        //     ...thingInfo
                        // });
                        // console.log('.... active:', (r.state as any).isActive); // tslint:disable-line

                        console.log(`(${r.name}) active:`, r.state.isActive); // tslint:disable-line
                    };
                    routerInstance.manager.tracerSession.subscribeToThing(
                        routerName,
                        tracerUpdateFn
                    );
                });
            }

            const tracer = routerInstance.manager.tracerSession.tracerThing(routerInstance.name);

            // if called from another action wrapper
            let updatedLocation: IInputLocation;
            if (existingLocation) {
                tracer.logStep('Called from an existing location');
                // set cache before location changes b/c cache info is derived from location path
                if (actionName === 'hide') {
                    tracer.logStep('Hiding');
                    updatedLocation = routerInstance.manager.setCacheAndHide(
                        options,
                        existingLocation,
                        routerInstance,
                        ctx
                    );
                }

                const newLocation = {...existingLocation, ...updatedLocation};
                // if the parent router isn't visible, but the child is shown, show all parents
                if (
                    actionName === 'show' &&
                    routerInstance.parent &&
                    (routerInstance.parent.state.visible === false ||
                        routerInstance.parent.state.visible === undefined) &&
                    ctx.callDirection !== 'down'
                ) {
                    tracer.logStep(
                        `Calling 'show' action of router parent: ${routerInstance.parent.name} `
                    );

                    // console.log(`(pass) Calling parent of router: ${ routerInstance.name } ----${ routerInstance.parent.name } `)
                    // data routers dont have a visibility state by default. TODO FIX THIS
                    updatedLocation = routerInstance.parent.show(
                        {},
                        {...newLocation},
                        routerInstance.parent,
                        {...ctx, callDirection: 'up', activatedByChildType: this.type}
                    );
                }

                tracer.logStep(`Calling actionFn`);

                // console.log(`(pass) Calling actionFn for ${ routerInstance.name }`)
                // Call the router's action after any actions on the parent have been taken care of
                updatedLocation = actionFn(
                    options,
                    {...newLocation, ...updatedLocation},
                    routerInstance,
                    ctx
                );

                // Call actions on the children after this router's action have been taken care of
                if (actionName === 'show') {
                    // console.log(`(pass) Calling child of router: ${ routerInstance.name } `)
                    tracer.logStep(`Calling 'show' action of router's children`);

                    // add location defaults from children
                    updatedLocation = routerInstance.manager.setChildrenDefaults(
                        options,
                        {...newLocation, ...updatedLocation},
                        routerInstance,
                        ctx
                    );
                }

                tracer.endWithMessage(`Returning location`);
                return {...newLocation, ...updatedLocation};
            }

            tracer.logStep('Called from a new location');

            // if called directly, fetch location
            updatedLocation = this.manager.serializedStateStore.getState();

            // if the parent router isn't visible, but the child is shown, show all parents
            if (
                actionName === 'show' &&
                routerInstance.parent &&
                (routerInstance.parent.state.visible === false ||
                    routerInstance.parent.state.visible === undefined) &&
                ctx.callDirection !== 'down'
            ) {
                tracer.logStep(
                    `Calling 'show' action of router parent: ${routerInstance.parent.name}`
                );

                // console.log(`(start) Calling parent of router: ${routerInstance.name} ---- ${routerInstance.parent.name}`)

                // data routers dont have a visibility state by default. TODO FIX THIS
                updatedLocation = routerInstance.parent.show(
                    {},
                    {...updatedLocation},
                    routerInstance.parent,
                    {...ctx, callDirection: 'up', activatedByChildType: this.type}
                );
            }

            // set cache before location changes b/c cache info is derived from location path
            if (actionName === 'hide') {
                tracer.logStep('Hiding');
                updatedLocation = routerInstance.manager.setCacheAndHide(
                    options,
                    {...updatedLocation},
                    routerInstance,
                    ctx
                );
            }

            // console.log(`(start) Calling actionFn for ${routerInstance.name}`)
            tracer.logStep(`Calling actionFn`);

            // Call the router's action after any actions on the parent have been taken care of
            updatedLocation = actionFn(options, {...updatedLocation}, routerInstance, ctx);

            // If this action is a direct call from the user, remove all caching
            if (actionName === 'hide' && routerInstance.state.visible === true) {
                routerInstance.cache.setWasPreviouslyVisibleTo(false);
            }

            if (actionName === 'show') {
                // console.log(`(start) Calling child of router: ${routerInstance.name}`, options, ctx)
                tracer.logStep(`Calling 'show' action of router's children`);

                // add location defaults from children
                updatedLocation = routerInstance.manager.setChildrenDefaults(
                    options,
                    {...updatedLocation},
                    routerInstance,
                    ctx
                );
            }

            // add user options to new location options
            updatedLocation.options = {...updatedLocation.options, ...options};

            // set serialized state
            this.manager.serializedStateStore.setState({...updatedLocation});
            // return location so the function signature of the action is the same
            tracer.endWithMessage(`Returning location`);
            // setTimeout(() => {
            routerInstance.manager.tracerSession.endWithMessage('Action complete');
            console.log(
                'TOTAL TIME',
                routerInstance.manager.tracerSession.endTime -
                    routerInstance.manager.tracerSession.startTime
            );
            // }, 3000);
            // const things = routerInstance.manager.tracerSession.tracerThings;
            // Object.keys(things).forEach(tName => console.log(tName, things[tName].isActive)) // tslint:disable-line
            return {...updatedLocation};
        }

        if (this.actionFnDecorator) {
            return this.actionFnDecorator(actionWrapper);
        }
        return actionWrapper;
    };

    protected initializeManager({
        routerTree,
        serializedStateStore,
        routerStateStore,
        router,
        customTemplates,
        defaultTemplates
    }: IManagerInit<CustomTemplates, DefaultTemplates>): void {
        this.routerStateStore = routerStateStore || new DefaultRouterStateStore();

        // check if window
        if (typeof window === 'undefined') {
            this.serializedStateStore = serializedStateStore || new NativeSerializedStore();
        } else {
            this.serializedStateStore = serializedStateStore || new BrowserSerializedStore();
        }

        // router types
        const defaults = defaultTemplates || routerTemplates;
        this.templates = {...defaults, ...customTemplates} as DefaultTemplates & CustomTemplates;

        // TODO implement
        // Manager.validateTemplates(templates);
        // validate all template names are unique
        // validation should make sure action names dont collide with any Router method names

        const BaseRouter = router || DefaultRouter;
        this.routerTypes = (Object.keys(this.templates) as Array<RouterTypeNames>).reduce(
            (acc, templateName) => {
                // fetch template
                const selectedTemplate = this.templates[templateName];
                // get function used to wrape actions
                const createActionWrapperFunction = this.createActionWrapperFunction;
                // create router class from the template
                const RouterFromTemplate = createRouterFromTemplate<
                    RouterCurrentState,
                    typeof BaseRouter,
                    typeof selectedTemplate,
                    typeof templateName
                >(BaseRouter, templateName, selectedTemplate, createActionWrapperFunction);

                // add new Router type to accumulator
                acc[templateName] = RouterFromTemplate;
                return acc;
            },
            {} as {[routerTypeName in RouterTypeNames]: RouterClass<Actions, RouterCurrentState>}
        );

        // add initial routers
        this.addRouters(routerTree);

        // subscribe to URL changes and update the router state when this happens
        // the subject (BehaviorSubject) will notify the observer of its existing state
        this.serializedStateStore.subscribeToStateChanges(this.setNewRouterState.bind(this));

        this.rootRouter.show();
    }

    get routers(): Record<string, InstanceType<RouterClass<Actions, RouterCurrentState>>> {
        return this._routers;
    }

    /**
     * Adds the initial routers defined during initialization
     */
    public addRouters = (
        router: IRouterDeclaration<RouterTypeNames> = null,
        type: RouterTypeNames = null,
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
        const childRouters = router.routers || {};
        Object.keys(childRouters).forEach(childType => {
            childRouters[childType].forEach(child =>
                this.addRouters(child, childType, router.name)
            );
        });
    };

    /**
     * High level method for adding a router to the router state tree based on an input router declaration object
     *
     * This method will add the router to the manager and correctly associate the router with
     * its parent and any child routers
     */
    public addRouter(routerDeclaration: IRouterDeclaration<RouterTypeNames>): void {
        const {name, parentName, type} = routerDeclaration;
        const parent = this.routers[parentName];

        // Set the root router type if the router has no parent
        const routerType = !parentName && !this.rootRouter ? 'root' : type;
        const config = this.createRouterConfigArgs(routerDeclaration, routerType, parent);

        // Create a router
        const router = this.createRouter({name, config, type: routerType, parentName});

        // Set the created router as the parent router
        // if it has no parent and there is not yet a root
        if (!parentName && !this.rootRouter) {
            this.rootRouter = router;
        } else if (!parentName && this.rootRouter) {
            throw new Error(
                'Root router already exists. You likely forgot to specify a parentName'
            );
        }

        if (parent) {
            // Fetch the parent, and assign a ref of it to this router
            router.parent = parent;

            // Add ref of new router to the parent
            const siblingTypes = parent.routers[type] || [];
            siblingTypes.push(router);
            parent.routers[type] = siblingTypes;
        }

        // Add ref of new router to manager
        this.registerRouter(name, router);

        if (router.isPathRouter) {
            this.validateNeighborsOfOtherTypesArentPathRouters(router);
        }
    }

    /**
     * Remove a router from the routing tree and manager
     * Removing a router will also remove all of its children
     */
    public removeRouter = (name: string): void => {
        const router = this.routers[name];
        const {parent, routers, type} = router;

        // Delete ref the parent (if any) stores
        if (parent) {
            const routersToKeep = parent.routers[type].filter(child => child.name !== name);
            parent.routers[type] = routersToKeep;
        }

        // Recursively call this method for all children
        const childrenTypes = Object.keys(routers);
        childrenTypes.forEach(childType => {
            routers[childType].forEach(childRouter => this.removeRouter(childRouter.name));
        });

        // Remove router related state subscribers
        this.routerStateStore.unsubscribeAllObserversForRouter(name);

        // Delete ref the manager stores
        this.unregisterRouter(name);
    };

    protected registerRouter(
        name: string,
        router: InstanceType<RouterClass<Actions, RouterCurrentState>>
    ): void {
        this._routers[name] = router;
    }

    protected unregisterRouter(name: string): void {
        delete this._routers[name];
    }

    /**
     * Called on every location change
     * TODO make this method not mutate `newState`
     */
    public calcNewRouterState(
        location: IInputLocation,
        router: RouterClass<Actions, RouterCurrentState>,
        ctx: ILocationActionContext = {},
        newState: Record<string, RouterCurrentState> = {}
    ): Record<string, RouterCurrentState> {
        if (!router) {
            return;
        }

        // Call the routers reducer to calculate its state from the new location
        newState[router.name] = router.reducer(location, router, ctx);

        // Recursively call all children to add their state to the `newState` object
        Object.keys(router.routers).forEach(type => {
            router.routers[type].forEach(childRouter =>
                this.calcNewRouterState(location, childRouter, ctx, newState)
            );
        });

        return newState;
    }

    protected createRouterConfigArgs(
        routerDeclaration: IRouterDeclaration<RouterTypeNames>,
        routerType: RouterTypeNames,
        parent: RouterClass<Actions, RouterCurrentState>
    ): IRouterCreationInfo<RouterTypeNames>['config'] {
        const templateConfig = this.templates[routerType].config;
        const hasParentOrIsRoot =
            parent && parent.isPathRouter !== undefined ? parent.isPathRouter : true;
        const isSetToBePathRouter =
            routerDeclaration.isPathRouter !== undefined
                ? routerDeclaration.isPathRouter
                : templateConfig.isPathRouter || false;
        const isSetToInverselyActivate =
            routerDeclaration.shouldInverselyActivate !== undefined
                ? routerDeclaration.shouldInverselyActivate
                : templateConfig.shouldInverselyActivate || false;
        const isSetToDisableCaching =
            routerDeclaration.disableCaching !== undefined
                ? routerDeclaration.disableCaching
                : templateConfig.disableCaching;

        return {
            routeKey: routerDeclaration.routeKey || routerDeclaration.name,
            isPathRouter:
                templateConfig.canBePathRouter && hasParentOrIsRoot && isSetToBePathRouter,
            shouldInverselyActivate: isSetToInverselyActivate,
            disableCaching: isSetToDisableCaching,
            defaultAction: routerDeclaration.defaultAction || []
        };
    }

    protected validateNeighborsOfOtherTypesArentPathRouters(
        router: RouterClass<Actions, RouterCurrentState>
    ): void {
        const nameOfNeighboorRouterThatIsPathRouter = router
            .getNeighbors()
            .reduce((acc, r) => (r.isPathRouter ? r.name : acc), undefined as string | undefined);
        if (nameOfNeighboorRouterThatIsPathRouter) {
            throw new Error(
                `Cannot add ${router.name}. 
                This router is supposed to be a path router but a neighbor (${nameOfNeighboorRouterThatIsPathRouter} is already a path router.
                In order to make the router state tree deterministic only one type of neighbor should have isPathRouter set to true. 
                To get rid of this error either use a different router type or set on neighbor router type to isPathRouter to false `
            );
        }
    }

    protected validateRouterCreationInfo(
        name: string,
        type: RouterTypeNames,
        config: IRouterConfig
    ): void {
        // Check if the router type exists
        if (!this.routerTypes[type] && type !== 'root') {
            throw new Error(
                `The router type ${type} for router '${name}' does not exist. Consider creating a template for this type.`
            );
        }

        // Check to make sure a router with the same name hasn't already been added
        if (this.routers[name]) {
            throw new Error(`A router with the name '${name}' already exists.`);
        }

        // Check if the router routeKey is unique
        const routeKeyAlreadyExists = Object.values(this.routers).reduce((acc, r) => {
            return acc || r.routeKey === config.routeKey;
        }, false);
        if (routeKeyAlreadyExists) {
            throw new Error(`A router with the routeKey '${config.routeKey}' already exists`);
        }
    }

    /**
     *
     * Creates the arguments that the router object constructor expects
     *
     * This method is overridden by libraries like `router-primitives-mobx` as it is a convenient
     * place to redefine the getters and setters `getState` and `subscribe`
     */
    protected createNewRouterInitArgs({
        name,
        config,
        type,
        parentName
    }: IRouterCreationInfo<RouterTypeNames>): IRouterInitArgs<RouterTypeNames> {
        const parent = this.routers[parentName];
        const actions = Object.keys(this.templates[type].actions);

        return {
            name,
            config: {...config},
            type,
            parent,
            routers: {},
            manager: this,
            root: this.rootRouter,
            getState: this.routerStateStore.createRouterStateGetter(name),
            subscribe: this.routerStateStore.createRouterStateSubscriber(name),
            actions
        };
    }

    /**
     * Create a router instance
     *
     * Redefined by libraries like `router-primitives-mobx`.
     * Good place to change the base router prototype or decorate methods
     */
    protected createRouterFromInitArgs(
        initalArgs: IRouterInitArgs<RouterTypeNames>
    ): InstanceType<RouterClass<Actions, RouterCurrentState>> {
        const routerClass = this.routerTypes[initalArgs.type];
        // TODO add tests for passing of action names
        // return new (routerClass as any)({...initalArgs}) as RouterT;
        const a = new routerClass({...initalArgs});
        return a;
    }

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
    protected setNewRouterState(location: IInputLocation): void {
        const newState = this.calcNewRouterState(location, this.rootRouter);
        this.routerStateStore.setState(newState);
    }

    /**
     * Method for creating a router. Routers created with this method
     * aren't added to the manager and are missing connections to parent and child routers
     *
     * To correctly add a router such that it can be managed by the manager and has
     * parent and child router connections, use one of the `add` methods on the manager.
     * Those methods use this `createRouter` method in turn.
     */
    protected createRouter<T>({
        name,
        config,
        type,
        parentName
    }: IRouterCreationInfo<RouterTypeNames>): InstanceType<
        RouterClass<Actions, RouterCurrentState>
    > {
        this.validateRouterCreationInfo(name, type, config);

        const initalArgs = this.createNewRouterInitArgs({name, config, type, parentName});
        return this.createRouterFromInitArgs({...initalArgs});
    }
}
