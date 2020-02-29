import defaultRouterTemplates from './router/template';

import {BrowserSerializedStore, NativeSerializedStore} from './serializedState';
import {TracerSession} from './tracer';
import {IManager} from './types/manager';
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
    RouterClass,
    IRouterTemplates,
    // ManagerRouters,
    Constructable,
    RouterInstance,
    AllTemplates,
    RouterCurrentStateFromTemplates,
    ExtractCustomStateFromTemplate,
    RouterReducerFn
} from './types';

import DefaultRouter from './router/base';
import DefaultRouterStateStore from './routerState';
import {objKeys} from './utilities';
// import {DefaultTemplates} from './types/router_templates';
import createActionWrapperFunction from './manager/create_action_wraper_function';

// const capitalize = (name = ''): string => name.charAt(0).toUpperCase() + name.slice(1);

// extend router base for specific type
const createRouterFromTemplate = <
    CustomTemplates extends IRouterTemplates,
    RouterTypeName extends NarrowRouterTypeName<keyof AllTemplates<CustomTemplates>>,
    // TODO figure out why RouterClass can't be used here instead.
    // It has a similar but more specific signature.
    RC extends Constructable = Constructable
>(
    templateName: RouterTypeName,
    template: AllTemplates<CustomTemplates>[RouterTypeName],
    BaseRouter: RC,
    actionFnDecorator?: ActionWraperFnDecorator
): RouterClass<AllTemplates<CustomTemplates>, RouterTypeName, IManager<CustomTemplates>> => {
    // TODO figure out why actions are 'default router actions' type
    const {actions, reducer} = template;

    const MixedInClass = class extends BaseRouter {
        // change the router name to include the type
        // constructor.name = `${capitalize(templateName.toString())}Router`;

        // eslint-disable-next-line
        constructor(...args: any[]) {
            super(...args);
            // add actions to RouterType
            objKeys(actions).forEach(actionName => {
                Object.assign(this, {
                    [actionName]: createActionWrapperFunction(
                        actions[actionName],
                        actionName,
                        actionFnDecorator
                    )
                });
            });

            // add reducer to RouterType
            Object.assign(this, {
                reducer
            });
        }
    };
    return (MixedInClass as unknown) as RouterClass<
        AllTemplates<CustomTemplates>,
        RouterTypeName,
        IManager<CustomTemplates>
    >;
};

// implements IManager<CustomTemplates>
export default class Manager<CustomTemplates extends IRouterTemplates = {}> {
    public actionFnDecorator?: ActionWraperFnDecorator;
    public tracerSession: TracerSession;
    public _routers: Record<string, RouterInstance<AllTemplates<CustomTemplates>>>;
    // ManagerRouters<AllTemplates<CustomTemplates>>;
    public rootRouter: Root<AllTemplates<CustomTemplates>>;
    public serializedStateStore: IManagerInit<CustomTemplates>['serializedStateStore'];
    public routerStateStore: IManagerInit<CustomTemplates>['routerStateStore'];
    public routerTypes: ManagerRouterTypes<
        AllTemplates<CustomTemplates>,
        IManager<CustomTemplates>
    >;

    public templates: AllTemplates<CustomTemplates>;
    public routerCacheClass: IManagerInit<CustomTemplates>['routerCacheClass'];

    constructor(
        initArgs: IManagerInit<CustomTemplates> = {},
        {
            shouldInitialize,
            actionFnDecorator
        }: {shouldInitialize: boolean; actionFnDecorator?: ActionWraperFnDecorator} = {
            shouldInitialize: true
        }
    ) {
        if (actionFnDecorator) {
            this.actionFnDecorator = actionFnDecorator;
        }
        shouldInitialize && this.initializeManager(initArgs);
    }

    initializeManager({
        routerTree,
        serializedStateStore,
        routerStateStore,
        router,
        customTemplates,
        routerCacheClass
    }: // defaultTemplates
    IManagerInit<CustomTemplates>): void {
        this.routerStateStore =
            routerStateStore ||
            new DefaultRouterStateStore<RouterCurrentStateFromTemplates<CustomTemplates>>();

        // check if window
        if (typeof window === 'undefined') {
            this.serializedStateStore = serializedStateStore || new NativeSerializedStore();
        } else {
            this.serializedStateStore = serializedStateStore || new BrowserSerializedStore();
        }

        if (routerCacheClass) {
            this.routerCacheClass = routerCacheClass;
        }

        // router types
        // const defaults = defaultTemplates || defaultRouterTemplates;
        this.templates = ({
            ...defaultRouterTemplates,
            ...customTemplates
        } as unknown) as AllTemplates<CustomTemplates>;

        // TODO implement
        // Manager.validateTemplates(templates);
        // validate all template names are unique
        // validation should make sure action names dont collide with any Router method names

        const BaseRouter = router || DefaultRouter;
        this.routerTypes = objKeys(this.templates).reduce(
            (acc, templateName) => {
                // fetch template
                const selectedTemplate = this.templates[templateName];
                // get function used to wrape actions
                // const createActionWrapperFunction = this.createActionWrapperFunction;
                // create router class from the template
                const RouterFromTemplate = createRouterFromTemplate(
                    templateName as NarrowRouterTypeName<keyof AllTemplates<CustomTemplates>>,
                    selectedTemplate as AllTemplates<CustomTemplates>[NarrowRouterTypeName<
                        keyof AllTemplates<CustomTemplates>
                    >],
                    BaseRouter,
                    this.actionFnDecorator
                    // createActionWrapperFunction
                    // as <Fn extends RouterActionFn>(
                    //     actionFn: Fn,
                    //     actionName: keyof AllTemplates<CustomTemplates>[NarrowRouterTypeName<
                    //         keyof AllTemplates<CustomTemplates>
                    //     >]['actions']
                    // ) => Fn
                );

                // add new Router type to accumulator
                acc[
                    templateName // as NarrowRouterTypeName<keyof AllTemplates<CustomTemplates>>
                    // eslint-disable-next-line
                ] = RouterFromTemplate; //as any; // TODO Fix this any

                return acc;
            },
            {} as ManagerRouterTypes<AllTemplates<CustomTemplates>, IManager<CustomTemplates>>
        );

        // add initial routers
        this.addRouters(routerTree);

        // subscribe to URL changes and update the router state when this happens
        // the subject (BehaviorSubject) will notify the observer of its existing state
        this.serializedStateStore.subscribeToStateChanges(this.setNewRouterState.bind(this));

        this.rootRouter.show();
    }

    get routers(): Record<string, RouterInstance<AllTemplates<CustomTemplates>>> {
        return this._routers;
    }

    /**
     * Adds the initial routers defined during initialization
     */
    public addRouters = (
        router: IRouterDeclaration<AllTemplates<CustomTemplates>> = null,
        type: NarrowRouterTypeName<keyof (AllTemplates<CustomTemplates>)> = null,
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
     * High level method for adding a router to the router state tree based on an input router declaration object
     *
     * This method will add the router to the manager and correctly associate the router with
     * its parent and any child routers
     */
    public addRouter(routerDeclaration: IRouterDeclaration<AllTemplates<CustomTemplates>>): void {
        const {name, parentName, type} = routerDeclaration;
        const parent = this.routers[parentName];

        // Set the root router type if the router has no parent
        const routerType = (!parentName && !this.rootRouter
            ? 'root'
            : type) as NarrowRouterTypeName<keyof AllTemplates<CustomTemplates>>;
        const config = this.createRouterConfigArgs(routerDeclaration, routerType, parent); //as IRouterConfig; // TODO figure out why this assertion is necessary

        // Create a router
        const router = this.createRouter({name, config, type: routerType, parentName});

        // Set the created router as the parent router
        // if it has no parent and there is not yet a root
        if (!parentName && !this.rootRouter) {
            // TODO figure out why this assertion doesnt sufficently overlap with the `router` type above
            this.rootRouter = (router as unknown) as Root<AllTemplates<CustomTemplates>>;
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
        const childrenTypes = objKeys(routers);
        childrenTypes.forEach(childType => {
            routers[childType].forEach(childRouter => this.removeRouter(childRouter.name));
        });

        // Remove router related state subscribers
        this.routerStateStore.unsubscribeAllObserversForRouter(name);

        // Delete ref the manager stores
        this.unregisterRouter(name);
    };

    registerRouter(name: string, router: RouterInstance<AllTemplates<CustomTemplates>>): void {
        this._routers[name] = router;
    }

    unregisterRouter(name: string): void {
        delete this._routers[name];
    }

    /**
     * Called on every location change
     */
    public calcNewRouterState<
        Name extends NarrowRouterTypeName<keyof (AllTemplates<CustomTemplates>)>
    >(
        location: IInputLocation,
        router: RouterInstance<AllTemplates<CustomTemplates>, Name>,
        ctx: Omit<ILocationActionContext, 'actionName'> = {},
        newState: Record<string, RouterCurrentStateFromTemplates<CustomTemplates>> = {}
    ): Record<string, RouterCurrentStateFromTemplates<CustomTemplates>> {
        if (!router) {
            return;
        }

        // Call the routers reducer to calculate its state from the new location
        const currentRouterState = (router.reducer as RouterReducerFn<
            ExtractCustomStateFromTemplate<AllTemplates<CustomTemplates>[Name]>
        >)(location, router, ctx);

        // Recursively call all children to add their state to the `newState` object
        return objKeys(router.routers).reduce(
            (acc, type) => {
                const newStatesForType = router.routers[type].reduce((accc, childRouter) => {
                    const state = this.calcNewRouterState(
                        location,
                        // cast to be any router instance
                        childRouter,
                        ctx,
                        accc
                    );
                    return {...acc, ...state};
                }, acc);
                return {...acc, ...newStatesForType};
            },
            {...newState, [router.name]: currentRouterState} as Record<
                string,
                RouterCurrentStateFromTemplates<CustomTemplates>
            >
        );
    }

    createRouterConfigArgs<Name extends NarrowRouterTypeName<keyof AllTemplates<CustomTemplates>>>(
        routerDeclaration: IRouterDeclaration<AllTemplates<CustomTemplates>>,
        routerType: Name,
        parent: RouterInstance<AllTemplates<CustomTemplates>, Name>
    ): IRouterConfig {
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
                : templateConfig.shouldInverselyActivate || true;
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

    validateNeighborsOfOtherTypesArentPathRouters<
        Name extends NarrowRouterTypeName<keyof AllTemplates<CustomTemplates>>
    >(router: RouterInstance<AllTemplates<CustomTemplates>, Name>): void {
        const nameOfNeighboorRouterThatIsPathRouter = router
            .getNeighbors()
            .reduce((acc, r) => (r.isPathRouter ? r.name : acc), undefined);
        if (nameOfNeighboorRouterThatIsPathRouter) {
            throw new Error(
                `Cannot add ${router.name}. 
                This router is supposed to be a path router but a neighbor (${nameOfNeighboorRouterThatIsPathRouter} is already a path router.
                In order to make the router state tree deterministic only one type of neighbor should have isPathRouter set to true. 
                To get rid of this error either use a different router type or set on neighbor router type to isPathRouter to false `
            );
        }
    }

    validateRouterCreationInfo<
        Name extends NarrowRouterTypeName<keyof (AllTemplates<CustomTemplates>)>
    >(name: string, type: Name, config: IRouterConfig): void {
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
    createNewRouterInitArgs<
        // Name extends NarrowRouterTypeName<
        //     NarrowRouterTypeName<keyof (AllTemplates<CustomTemplates>)>
        // >
        Name extends NarrowRouterTypeName<keyof (AllTemplates<CustomTemplates>)>

        // M extends Manager
    >({
        name,
        config,
        type,
        parentName
    }: IRouterCreationInfo<AllTemplates<CustomTemplates>, Name>): IRouterInitArgs<
        AllTemplates<CustomTemplates>,
        Name,
        IManager<CustomTemplates>
    > {
        const parent = this.routers[parentName];
        const actions = objKeys(this.templates[type].actions);

        return {
            name,
            config: {...config},
            type,
            parent,
            routers: {},
            manager: this as IManager<CustomTemplates>,
            root: this.rootRouter,
            getState: this.routerStateStore.createRouterStateGetter(name),
            subscribe: this.routerStateStore.createRouterStateSubscriber(name),
            actions,
            cache: this.routerCacheClass as any // eslint-disable-line
        };
    }

    /**
     * Create a router instance
     *
     * Redefined by libraries like `router-primitives-mobx`.
     * Good place to change the base router prototype or decorate methods
     */
    createRouterFromInitArgs<
        Name extends NarrowRouterTypeName<keyof (AllTemplates<CustomTemplates>)>
    >(
        initalArgs: IRouterInitArgs<
            AllTemplates<CustomTemplates>,
            NarrowRouterTypeName<Name>,
            IManager<CustomTemplates>
        >
    ): RouterInstance<AllTemplates<CustomTemplates>, NarrowRouterTypeName<Name>> {
        const routerClass = this.routerTypes[initalArgs.type];
        // TODO add tests for passing of action names
        // const s = initalArgs;
        return new routerClass({...initalArgs});
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
    setNewRouterState(location: IInputLocation): void {
        // TODO fix this any assertion
        // eslint-disable-next-line
        const newState = this.calcNewRouterState(location, this.rootRouter as any);
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
    createRouter<Name extends NarrowRouterTypeName<keyof (AllTemplates<CustomTemplates>)>>({
        name,
        config,
        type,
        parentName
    }: IRouterCreationInfo<
        AllTemplates<CustomTemplates>,
        NarrowRouterTypeName<Name>
    >): RouterInstance<AllTemplates<CustomTemplates>, Name> {
        this.validateRouterCreationInfo(name, type, config);

        const initalArgs = this.createNewRouterInitArgs({name, config, type, parentName});
        return this.createRouterFromInitArgs({...initalArgs}) as RouterInstance<
            AllTemplates<CustomTemplates>,
            // TODO fix me
            any // eslint-disable-line
        >;
    }
}

// const test = new Manager<{ custom: DefaultTemplates['stack'] }>({} as any);
// test.rootRouter.routers['custom'];
// test.rootRouter;
// test.routers;
// const b = new test.routerTypes.custom({} as any);
// const d = b.reducer('a' as any, 'b' as any, 'c' as any);
// b.toBack;
