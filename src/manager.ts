import {NativeSerializedStore, BrowserSerializedStore} from './serializedState';
import DefaultRouterStateStore from './routerState';
import DefaultRouter from './router/base';
import * as defaultTemplates from './router/template';
import {
    IRouterDeclaration,
    IRouter as RouterT,
    IRouterTemplate,
    IInputLocation,
    ILocationActionContext,
    RouterAction,
    IOutputLocation,
    IRouterCreationInfo,
    IRouterActionOptions,
    IRouterConfig,
    IRouterInitArgs,
    IRouter
} from './types';

const capitalize = (name = '') => name.charAt(0).toUpperCase() + name.slice(1);

interface IInit {
    routerTree?: IRouterDeclaration;
    serializedStateStore?: NativeSerializedStore | BrowserSerializedStore;
    routerStateStore?: DefaultRouterStateStore;
    router?: typeof DefaultRouter;
    templates?: {[templateName: string]: IRouterTemplate};
}

export default class Manager {
    private static setChildrenDefaults(
        options: IRouterActionOptions,
        location: IInputLocation,
        router: RouterT,
        ctx: ILocationActionContext
    ) {
        let newLocation = {...location};
        Object.keys(router.routers).forEach(routerType => {
            router.routers[routerType].forEach(child => {
                // if the cached visibility state is 'false' don't show on rehydration
                if (child.cache.state === false) {
                    return;
                }

                // if there is a cache state, show the router
                if (child.cache.state === true) {
                    // the cache has been 'used' so remove it
                    child.cache.removeCache();

                    const newContext = {...ctx, addingDefaults: true}; // TODO check if it makes sense to move addingDefaults to options
                    newLocation = child.show(options, newLocation, child, newContext);
                }

                // if there is no cache state and there is a default action, apply the action
                else if (child.config.defaultAction && child.config.defaultAction.length > 0) {
                    const [action, ...args] = child.config.defaultAction;

                    const newContext = {...ctx, addingDefaults: true};

                    newLocation = (child as any)[action](
                        {...options, data: args[0]},
                        newLocation,
                        child,
                        newContext
                    );
                }
            });
        });

        return newLocation;
    }

    private static setCacheAndHide(
        options: IRouterActionOptions,
        location: IInputLocation,
        router: RouterT,
        ctx: ILocationActionContext = {}
    ) {
        let newLocation = location;
        let disableCaching: boolean | undefined;

        // figure out if caching should occur
        if (router.config.disableCaching !== undefined) {
            disableCaching = router.config.disableCaching;
        } else {
            disableCaching = ctx.disableCaching || false;
        }

        Object.keys(router.routers).forEach(routerType => {
            router.routers[routerType].forEach(child => {
                // update ctx object's caching attr for this branch
                ctx.disableCaching = disableCaching;

                // call location action
                newLocation = child.hide({}, newLocation, child, ctx);
            });
        });

        // Use caching figured out above b/c the ctx object might get mutated when
        //   transversing the router tree
        // Also make sure there is a local request to disableCaching for this particular router (via options)
        // const shouldCache = disableCaching === false && options.disableCaching === false

        const shouldCache = !disableCaching && !(options.disableCaching || false);
        router.name === 'imDataa' ||
            (router.name === 'imData2' &&
                // tslint:disable-next-line
                console.log(
                    `shouldCache for: ${router.name}`,
                    shouldCache,
                    disableCaching,
                    options.disableCaching
                ));

        if (shouldCache) {
            router.cache.setCacheFromLocation(newLocation, router);
        }

        return newLocation;
    }

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
    private static createActionWrapperFunction(actionFn: RouterAction, actionName: string) {
        function actionWrapper(
            options: IRouterActionOptions = {},
            existingLocation?: IOutputLocation,
            routerInstance = this,
            ctx: ILocationActionContext = {}
        ) {
            // if called from another action wrapper
            let updatedLocation: IInputLocation;
            if (existingLocation) {
                // set cache before location changes b/c cache info is derived from location path
                if (actionName === 'hide') {
                    updatedLocation = Manager.setCacheAndHide(
                        options,
                        existingLocation,
                        routerInstance,
                        ctx
                    );
                }

                updatedLocation = actionFn(options, existingLocation, routerInstance, ctx);

                if (actionName === 'show') {
                    // add location defaults from children
                    updatedLocation = Manager.setChildrenDefaults(
                        options,
                        updatedLocation,
                        routerInstance,
                        ctx
                    );
                }

                return updatedLocation;
            }

            // if the parent router isn't visible, but the child is shown, show all parents
            if (
                actionName === 'show' &&
                routerInstance.parent &&
                (routerInstance.parent.state.visible === false ||
                    routerInstance.parent.state.visible === undefined)
            ) {
                // data routers dont have a visiblity state by default. FIX THIS
                routerInstance.parent.show();
            }

            // if called directly, fetch location
            updatedLocation = this.manager.serializedStateStore.getState();

            // set cache before location changes b/c cache info is derived from location path
            if (actionName === 'hide') {
                updatedLocation = Manager.setCacheAndHide(
                    options,
                    updatedLocation,
                    routerInstance,
                    ctx
                );
            }

            updatedLocation = actionFn(options, updatedLocation, routerInstance, ctx);

            if (actionName === 'hide' && routerInstance.state.visible === true) {
                routerInstance.cache.setCache(false);
            }

            if (actionName === 'show') {
                // add location defaults from children
                updatedLocation = Manager.setChildrenDefaults(
                    options,
                    updatedLocation,
                    routerInstance,
                    ctx
                );
            }

            // add user options to new location options
            updatedLocation.options = {...updatedLocation.options, ...options};

            // set serialized state
            this.manager.serializedStateStore.setState(updatedLocation);
            // return location so the function signature of the action is the same
            return updatedLocation;
        }

        return actionWrapper;
    }

    public routers: {[routerName: string]: RouterT};
    public rootRouter: RouterT;
    public serializedStateStore: IInit['serializedStateStore'];
    public routerStateStore: IInit['routerStateStore'];
    public routerTypes: {[routerType: string]: RouterT};
    public templates: IInit['templates'];

    constructor({
        routerTree,
        serializedStateStore,
        routerStateStore,
        router,
        templates
    }: IInit = {}) {
        this.routerStateStore = routerStateStore || new DefaultRouterStateStore();
        this.routers = {};
        this.rootRouter = null;

        // check if window
        if (typeof window === 'undefined') {
            this.serializedStateStore = serializedStateStore || new NativeSerializedStore();
        } else {
            this.serializedStateStore = serializedStateStore || new BrowserSerializedStore();
        }

        // router types
        this.templates = {...defaultTemplates, ...templates};
        this.routerTypes = {};

        // TODO implement
        // Manager.validateTemplates(templates);
        // validate all template names are unique
        // validation should make sure action names dont collide with any Router method names

        const Router = router || DefaultRouter; //tslint:disable-line
        Object.keys(this.templates).forEach(templateName => {
            // create a RouterType off the base Router

            // extend router base for specific type
            class RouterType extends Router {}

            // change the router name to include the type
            Object.defineProperty(RouterType, 'name', {value: `${capitalize(templateName)}Router`});

            // fetch template
            const selectedTemplate = this.templates[templateName];

            // add actions to RouterType
            Object.keys(selectedTemplate.actions).forEach(actionName => {
                (RouterType as any).prototype[actionName] = Manager.createActionWrapperFunction(
                    selectedTemplate.actions[actionName],
                    actionName
                );
            });

            // add reducer to RouterType
            (RouterType.prototype as RouterT).reducer = selectedTemplate.reducer;

            // add parser to RouterType
            // RouterType.prototype.parser = selectedTemplate.parser;

            this.routerTypes[templateName] = (RouterType as any) as RouterT;
        });

        // add initial routers
        this.addRouters(routerTree);

        // subscribe to URL changes and update the router state when this happens
        // the subject (BehaviorSubject) will notify the observer of its existing state
        this.serializedStateStore.subscribeToStateChanges(this.setNewRouterState.bind(this));

        const newLocation = this.rootRouter.show();
    }

    /**
     * Adds the initial routers defined during initialization
     */
    public addRouters(
        router: IRouterDeclaration = null,
        type: string = null,
        parentName: string = null
    ) {
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
    }

    /**
     * High level method for adding a router to the router state tree based on an input router declaration object
     *
     * This method will add the router to the manager and correctly associate the router with
     * its parent and any child routers
     */
    public addRouter(routerDeclaration: IRouterDeclaration) {
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
        this.routers[name] = router;

        if (router.isPathRouter) {
            this.validateNeighborsOfOtherTypesArentPathRouters(router);
        }
    }

    public validateNeighborsOfOtherTypesArentPathRouters(router: RouterT) {
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

    /**
     * Remove a router from the routing tree and manager
     * Removing a router will also remove all of its children
     */
    public removeRouter(name: string) {
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
        delete this.routers[name];
    }

    /**
     * Called on every location change
     * TODO make this method not mutate `newState`
     */
    public calcNewRouterState(
        location: IInputLocation,
        router: RouterT,
        ctx: ILocationActionContext = {},
        newState: {[routerName: string]: {}} = {}
    ) {
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
        routerDeclaration: IRouterDeclaration,
        routerType: string,
        parent: RouterT
    ): IRouterCreationInfo['config'] {
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
                : templateConfig.disableCaching || false;

        return {
            routeKey: routerDeclaration.routeKey || routerDeclaration.name,
            isPathRouter:
                templateConfig.canBePathRouter && hasParentOrIsRoot && isSetToBePathRouter,
            shouldInverselyActivate: isSetToInverselyActivate,
            disableCaching: isSetToDisableCaching,
            defaultAction: routerDeclaration.defaultAction || []
        };
    }

    protected validateRouterCreationInfo(name: string, type: string, config: IRouterConfig): void {
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
    }: IRouterCreationInfo): IRouterInitArgs {
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
    protected createRouterFromInitArgs(initalArgs: IRouterInitArgs) {
        const routerClass = this.routerTypes[initalArgs.type];
        // TODO add tests for passing of action names
        return new (routerClass as any)({...initalArgs}) as RouterT;
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
    protected setNewRouterState(location: IInputLocation) {
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
    protected createRouter({name, config, type, parentName}: IRouterCreationInfo): RouterT {
        this.validateRouterCreationInfo(name, type, config);

        const initalArgs = this.createNewRouterInitArgs({name, config, type, parentName});
        return this.createRouterFromInitArgs({...initalArgs});
    }
}
