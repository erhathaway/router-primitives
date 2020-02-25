import defaultRouterTemplates from './router/template';

import {BrowserSerializedStore, NativeSerializedStore} from './serializedState';
import {TracerSession} from './tracer';
import {IManager} from './types/manager';
import {
    RouterActionFn,
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
    ManagerRouters,
    Constructable,
    RouterInstance,
    AllTemplates,
    RouterCurrentStateFromTemplates,
    Childs,
    ExtractCustomStateFromTemplate
} from './types';
import {IRouterStateStore} from './types/router_state';
import DefaultRouter from './router/base';
import DefaultRouterStateStore from './routerState';
import {objKeys} from './utilities';
import {DefaultTemplates} from './types/router_templates';
import DefaultRoutersStateStore from './routerState';

const capitalize = (name = ''): string => name.charAt(0).toUpperCase() + name.slice(1);

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
    actionWraperFn: <Fn extends RouterActionFn>(
        actionFn: Fn,
        actionName: keyof AllTemplates<CustomTemplates>[RouterTypeName]['actions']
    ) => Fn
): RouterClass<AllTemplates<CustomTemplates>, RouterTypeName, IManager<CustomTemplates>> => {
    // TODO figure out why actions are 'default router actions' type
    const {actions, reducer} = template;

    const MixedInClass = class extends BaseRouter {
        // change the router name to include the type
        name = `${capitalize(templateName.toString())}Router`;

        // eslint-disable-next-line
        constructor(...args: any[]) {
            super(...args);
            // add actions to RouterType
            objKeys(actions).forEach(actionName => {
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
    return (MixedInClass as unknown) as RouterClass<
        AllTemplates<CustomTemplates>,
        RouterTypeName,
        IManager<CustomTemplates>
    >;
};

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

// implements IManager<CustomTemplates>
export default class Manager<CustomTemplates extends IRouterTemplates = {}> {
    public actionFnDecorator?: ActionWraperFnDecorator;
    public tracerSession: TracerSession;
    public _routers: Record<string, ManagerRouters<AllTemplates<CustomTemplates>>>;
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

    // public setChildrenDefaults = <
    //     Name extends NarrowRouterTypeName<keyof (AllTemplates<CustomTemplates>)>,
    //     Router extends IRouterBase<AllTemplates<CustomTemplates>, Name> = IRouterBase<
    //         AllTemplates<CustomTemplates>,
    //         Name
    //     >
    // >(
    //     options: IRouterActionOptions,
    //     location: IInputLocation,
    //     router: Router,
    //     ctx: ILocationActionContext
    // ): IInputLocation => {
    //     const tracerSession = router.manager.tracerSession;
    //     const tracer = tracerSession.tracerThing(router.name);

    //     let newLocation = { ...location };
    //     // TODO don't mutate location
    //     // console.log(
    //     // tracer.logStep('Found number of children types', objKeys(router.routers).length)
    //     objKeys(router.routers).forEach(routerType => {
    //         // skip routers that called the parent router
    //         if (routerType === ctx.activatedByChildType) {
    //             tracer.logStep(
    //                 `Not calling child router type: ${routerType} b/c it is the same type of activation origin`
    //             );
    //             // console.log(`Not calling router b/c same type of active child`)

    //             return;
    //         }

    //         // as UnionOfChildren<
    //         //     TemplateOfRouter<Router['routers']>
    //         // >
    //         router.routers[routerType].forEach(child => {
    //             const childTracer = tracerSession.tracerThing(child.name);

    //             // prevent inverse activation if it is turned off
    //             if (ctx.callDirection === 'up' && child.config.shouldInverselyActivate === false) {
    //                 // console.log(`Not calling router b/c not inversely active: ${child.name}`)
    //                 childTracer.logStep(
    //                     `Not calling child router b/c it is not inversely active: ${child.name}`
    //                 );
    //                 return;
    //             }

    //             const newContext: ILocationActionContext = {
    //                 ...ctx,
    //                 addingDefaults: true,
    //                 activatedByChildType: undefined,
    //                 callDirection: 'down'
    //             }; // TODO check if it makes sense to move addingDefaults to options

    //             // if the cached visibility state is 'false' don't show on rehydration
    //             // if (child.cache.wasVisible === false) {
    //             //     console.log(`Not calling router b/c has no cache indicating previous visibility: ${child.name}`)

    //             //     // return;
    //             //     if (child.config.defaultAction && child.config.defaultAction.length > 0) {
    //             //         const [action, ...args] = child.config.defaultAction;
    //             //         console.log(`Applying default action: ${action} for ${child.name}`)

    //             //         newLocation = (child as any)[action](
    //             //             { ...options, data: args[0] }, // TODO pass more than just the first arg
    //             //             newLocation,
    //             //             child,
    //             //             newContext
    //             //         );
    //             //     }
    //             // }

    //             // if there is a cache state, show the router
    //             if (child.cache.wasVisible === true) {
    //                 // the cache has been 'used' so remove it
    //                 child.cache.removeCache();
    //                 tracer.logStep(
    //                     `Calling show action of child router b/c it has a cached previous visibility: ${child.name}`
    //                 );

    //                 newLocation = child.show(options, newLocation, child, newContext);
    //             }

    //             // if the cached visibility state is 'false' don't show on rehydration
    //             // or if there is no cache state and there is a default action, apply the action
    //             else if (child.config.defaultAction && child.config.defaultAction.length > 0) {
    //                 const [action, ...args] = child.config.defaultAction;
    //                 tracer.logStep(`(Applying default action: ${action} for ${child.name}`);

    //                 newLocation = child[action as keyof DefaultRouterActions](
    //                     { ...options, data: args[0] }, // TODO pass more than just the first arg
    //                     newLocation,
    //                     child,
    //                     newContext
    //                 );
    //             }
    //         });
    //     });

    //     return newLocation;
    // };

    // /**
    //  * Called when a router's 'hide' action is called directly or the
    //  * parent's 'hide' action is called.
    //  *
    //  * 1. Calculate whether caching is enabled by looking at explicit settings or defaulting to
    //  * the parents `disableCaching` status
    //  * 2. Hide child routers that are visible and pass along the current `disableCaching` status
    //  * 3. If caching is enabled, store a record that the router was previously visible
    //  *
    //  * TODO: dont mutate location state
    //  */
    // public setCacheAndHide = <
    //     Name extends NarrowRouterTypeName<keyof (AllTemplates<CustomTemplates>)>
    // >(
    //     options: IRouterActionOptions,
    //     location: IInputLocation,
    //     router: RouterInstance<AllTemplates<CustomTemplates>, Name>,
    //     ctx: ILocationActionContext = {}
    // ): IInputLocation => {
    //     const tracerSession = router.manager.tracerSession;
    //     const tracer = tracerSession.tracerThing(router.name);

    //     let newLocation = location;
    //     let disableCaching: boolean | undefined;

    //     // Figure out if caching should occur:
    //     // If the user hasn't set anything, we should fall back to the
    //     // context object and inherit the setting from the parent.
    //     // If the parent hasn't set a setting we are probably at root of the action call
    //     // and should fall back to using the template.
    //     if (router.config.disableCaching !== undefined) {
    //         disableCaching = router.config.disableCaching;
    //     } else {
    //         disableCaching =
    //             ctx.disableCaching || router.lastDefinedParentsDisableChildCacheState || false;
    //     }
    //     tracer.logStep('setting', { disableCaching });

    //     objKeys(router.routers).forEach(routerType => {
    //         router.routers[routerType].forEach(child => {
    //             // Update ctx object's caching setting for this branch of the router tree
    //             const newCtx = { ...ctx, disableCaching };

    //             // Call location 'hide' action if the child is visible
    //             const childTracer = tracerSession.tracerThing(child.name);
    //             childTracer.logStep('Looking at child');

    //             if (child.state.visible) {
    //                 childTracer.logStep('Calling `hide` action');
    //                 // console.log(`Hiding router: ${child.name}`)
    //                 newLocation = child.hide({}, newLocation, child, newCtx);
    //             } else {
    //                 childTracer.logStep('Not calling child b/c its hidden already');
    //             }
    //         });
    //     });

    //     // The `options.disableCaching` gives the caller of the direct action
    //     // the ability to disable caching on a case by case basis will interacting
    //     // with the router tree. We only want `options.disableCaching` to affect the immediate
    //     // router. If we want to disable caching for all routers use the ctx object
    //     // For example, `scene` routers use the `options.disableCaching` to disable sibling caches
    //     // so they don't get reshown when a parent causes a rehydration
    //     const shouldCache = !disableCaching && !(options.disableCaching || false);
    //     tracer.logStep('setting', { shouldCache });

    //     // console.log(`SHOULD CACHE: ${router.name}`, shouldCache, disableCaching, options.disableCaching)
    //     if (shouldCache) {
    //         // console.log(`Cache: storing was previously visible for router: ${router.name}`)
    //         // router.cache.setWasPreviouslyVisibleToFromLocation(newLocation as any, router as any)
    //         router.cache.setWasPreviouslyVisibleToFromLocation(newLocation, router);
    //     }

    //     return newLocation;
    // };

    // /**
    //  * Decorator around the `action` methods of a router.
    //  * Called every time an action is called.
    //  *
    //  * Common tasks are caching current router state, setting any default state,
    //  * and changing visibility in response to a parent or sibling action
    //  *
    //  * @param actionFn a router action function (RouterAction) that returns a location object (`IInputLocation`)
    //  * @param actionName name of the action. Usually `show` or `hide` but can be any custom action defined in a template
    //  *
    //  */
    // public createActionWrapperFunction = <
    //     WrappedFn extends RouterActionFn,
    //     ReturnedFn extends RouterActionFn
    // >(
    //     actionFn: WrappedFn,
    //     actionName: string
    // ): ReturnedFn => {
    //     function actionWrapper<
    //         Name extends NarrowRouterTypeName<keyof (AllTemplates<CustomTemplates>)>
    //     >(
    //         options: IRouterActionOptions = {},
    //         existingLocation?: IOutputLocation,
    //         routerInstance: RouterInstance<AllTemplates<CustomTemplates>, Name> = this,
    //         ctx: ILocationActionContext = {}
    //     ): IInputLocation {
    //         if (!existingLocation) {
    //             if (routerInstance.manager.tracerSession) {
    //                 routerInstance.manager.tracerSession.end();
    //                 routerInstance.manager.tracerSession.removeAllSubscriptions();
    //                 // routerInstance.manager.tracerSession.manager._moveSessionToFinishedStorage(routerInstance.manager.tracerSession)
    //                 // console.log('---------------------'); // tslint:disable-line
    //             }
    //             routerInstance.manager.tracerSession = tracerManager.newSession('Action started');
    //             objKeys(routerInstance.manager.routers).forEach(routerName => {
    //                 const r = routerInstance.manager.routers[routerName];
    //                 const tracerUpdateFn = (thingInfo: ITracerThing): void => {
    //                     // const lastStep = thingInfo.steps[thingInfo.steps.length - 1];
    //                     // console.log(`(${thingInfo.name}):`);

    //                     // console.log('....', lastStep && lastStep.name);
    //                     r.EXPERIMENTAL_setInternalState({ ...thingInfo });
    //                     // (currentInfo: IInternalState) => ({
    //                     //     ...currentInfo,
    //                     //     ...thingInfo
    //                     // });
    //                     // console.log('.... active:', (r.state as any).isActive); // tslint:disable-line

    //                     console.log(`(${r.name}) active:`, r.state.isActive); // tslint:disable-line
    //                 };
    //                 routerInstance.manager.tracerSession.subscribeToThing(
    //                     routerName,
    //                     tracerUpdateFn
    //                 );
    //             });
    //         }

    //         const tracer = routerInstance.manager.tracerSession.tracerThing(routerInstance.name);

    //         // if called from another action wrapper
    //         let updatedLocation: IInputLocation;
    //         if (existingLocation) {
    //             tracer.logStep('Called from an existing location');
    //             // set cache before location changes b/c cache info is derived from location path
    //             if (actionName === 'hide') {
    //                 tracer.logStep('Hiding');
    //                 updatedLocation = routerInstance.manager.setCacheAndHide(
    //                     options,
    //                     existingLocation,
    //                     routerInstance,
    //                     ctx
    //                 );
    //             }

    //             const newLocation = { ...existingLocation, ...updatedLocation };
    //             // if the parent router isn't visible, but the child is shown, show all parents
    //             if (
    //                 actionName === 'show' &&
    //                 routerInstance.parent &&
    //                 (routerInstance.parent.state.visible === false ||
    //                     routerInstance.parent.state.visible === undefined) &&
    //                 ctx.callDirection !== 'down'
    //             ) {
    //                 tracer.logStep(
    //                     `Calling 'show' action of router parent: ${routerInstance.parent.name} `
    //                 );

    //                 // console.log(`(pass) Calling parent of router: ${ routerInstance.name } ----${ routerInstance.parent.name } `)
    //                 // data routers dont have a visibility state by default. TODO FIX THIS
    //                 updatedLocation = routerInstance.parent.show(
    //                     {},
    //                     { ...newLocation },
    //                     routerInstance.parent,
    //                     { ...ctx, callDirection: 'up', activatedByChildType: routerInstance.type }
    //                 );
    //             }

    //             tracer.logStep(`Calling actionFn`);

    //             // console.log(`(pass) Calling actionFn for ${ routerInstance.name }`)
    //             // Call the router's action after any actions on the parent have been taken care of
    //             updatedLocation = actionFn(
    //                 options,
    //                 { ...newLocation, ...updatedLocation },
    //                 routerInstance,
    //                 ctx
    //             );

    //             // Call actions on the children after this router's action have been taken care of
    //             if (actionName === 'show') {
    //                 // console.log(`(pass) Calling child of router: ${ routerInstance.name } `)
    //                 tracer.logStep(`Calling 'show' action of router's children`);

    //                 // add location defaults from children
    //                 updatedLocation = routerInstance.manager.setChildrenDefaults(
    //                     options,
    //                     { ...newLocation, ...updatedLocation },
    //                     routerInstance,
    //                     ctx
    //                 );
    //             }

    //             tracer.endWithMessage(`Returning location`);
    //             return { ...newLocation, ...updatedLocation };
    //         }

    //         tracer.logStep('Called from a new location');

    //         // if called directly, fetch location
    //         updatedLocation = routerInstance.manager.serializedStateStore.getState();

    //         // if the parent router isn't visible, but the child is shown, show all parents
    //         if (
    //             actionName === 'show' &&
    //             routerInstance.parent &&
    //             (routerInstance.parent.state.visible === false ||
    //                 routerInstance.parent.state.visible === undefined) &&
    //             ctx.callDirection !== 'down'
    //         ) {
    //             tracer.logStep(
    //                 `Calling 'show' action of router parent: ${routerInstance.parent.name}`
    //             );

    //             // console.log(`(start) Calling parent of router: ${routerInstance.name} ---- ${routerInstance.parent.name}`)

    //             // data routers dont have a visibility state by default. TODO FIX THIS
    //             updatedLocation = routerInstance.parent.show(
    //                 {},
    //                 { ...updatedLocation },
    //                 routerInstance.parent,
    //                 { ...ctx, callDirection: 'up', activatedByChildType: routerInstance.type }
    //             );
    //         }

    //         // set cache before location changes b/c cache info is derived from location path
    //         if (actionName === 'hide') {
    //             tracer.logStep('Hiding');
    //             updatedLocation = routerInstance.manager.setCacheAndHide(
    //                 options,
    //                 { ...updatedLocation },
    //                 routerInstance,
    //                 ctx
    //             );
    //         }

    //         // console.log(`(start) Calling actionFn for ${routerInstance.name}`)
    //         tracer.logStep(`Calling actionFn`);

    //         // Call the router's action after any actions on the parent have been taken care of
    //         updatedLocation = actionFn(options, { ...updatedLocation }, routerInstance, ctx);

    //         // If this action is a direct call from the user, remove all caching
    //         if (actionName === 'hide' && routerInstance.state.visible === true) {
    //             routerInstance.cache.setWasPreviouslyVisibleTo(false);
    //         }

    //         if (actionName === 'show') {
    //             // console.log(`(start) Calling child of router: ${routerInstance.name}`, options, ctx)
    //             tracer.logStep(`Calling 'show' action of router's children`);

    //             // add location defaults from children
    //             updatedLocation = routerInstance.manager.setChildrenDefaults(
    //                 options,
    //                 { ...updatedLocation },
    //                 routerInstance,
    //                 ctx
    //             );
    //         }

    //         // add user options to new location options
    //         updatedLocation.options = { ...updatedLocation.options, ...options };

    //         // set serialized state
    //         routerInstance.manager.serializedStateStore.setState({ ...updatedLocation });
    //         // return location so the function signature of the action is the same
    //         tracer.endWithMessage(`Returning location`);
    //         // setTimeout(() => {
    //         routerInstance.manager.tracerSession.endWithMessage('Action complete');
    //         console.log(
    //             'TOTAL TIME',
    //             routerInstance.manager.tracerSession.endTime -
    //             routerInstance.manager.tracerSession.startTime
    //         );
    //         // }, 3000);
    //         // const things = routerInstance.manager.tracerSession.tracerThings;
    //         // objKeys(things).forEach(tName => console.log(tName, things[tName].isActive)) // tslint:disable-line
    //         return { ...updatedLocation };
    //     }

    //     if (this.actionFnDecorator) {
    //         return this.actionFnDecorator(actionWrapper) as ReturnedFn;
    //     }
    //     return actionWrapper as ReturnedFn;
    // };

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
                const createActionWrapperFunction = this.createActionWrapperFunction;
                // create router class from the template
                const RouterFromTemplate = createRouterFromTemplate(
                    templateName as NarrowRouterTypeName<keyof AllTemplates<CustomTemplates>>,
                    selectedTemplate as AllTemplates<CustomTemplates>[NarrowRouterTypeName<
                        keyof AllTemplates<CustomTemplates>
                    >],
                    BaseRouter,
                    createActionWrapperFunction as <Fn extends RouterActionFn>(
                        actionFn: Fn,
                        actionName: keyof AllTemplates<CustomTemplates>[NarrowRouterTypeName<
                            keyof AllTemplates<CustomTemplates>
                        >]['actions']
                    ) => Fn
                );

                // add new Router type to accumulator
                acc[
                    templateName as NarrowRouterTypeName<keyof AllTemplates<CustomTemplates>>
                    // eslint-disable-next-line
                ] = RouterFromTemplate as any; // TODO Fix this any

                return acc;
            },
            {} as ManagerRouterTypes<AllTemplates<CustomTemplates>>
        );

        // add initial routers
        this.addRouters(routerTree);

        // subscribe to URL changes and update the router state when this happens
        // the subject (BehaviorSubject) will notify the observer of its existing state
        this.serializedStateStore.subscribeToStateChanges(this.setNewRouterState.bind(this));

        this.rootRouter.show();
    }

    get routers(): Record<string, ManagerRouters<AllTemplates<CustomTemplates>>> {
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
        const config = this.createRouterConfigArgs(
            routerDeclaration,
            routerType,
            parent
        ) as IRouterConfig; // TODO figure out why this assertion is necessary

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
            const a = parent.routers['scene'];
            const routersToKeep = parent.routers[type].filter(child => child.name !== name);
            parent.routers[type as keyof typeof parent.routers] = routersToKeep;
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

    registerRouter<Name extends NarrowRouterTypeName<keyof (AllTemplates<CustomTemplates>)>>(
        name: string,
        router: RouterInstance<AllTemplates<CustomTemplates>, Name>
    ): void {
        this._routers[name] = router;
    }

    unregisterRouter(name: string): void {
        delete this._routers[name];
    }

    /**
     * Called on every location change
     * TODO make this method not mutate `newState`
     */
    public calcNewRouterState<
        Name extends NarrowRouterTypeName<keyof (AllTemplates<CustomTemplates>)>
    >(
        location: IInputLocation,
        router: RouterInstance<AllTemplates<CustomTemplates>, Name>,
        ctx: ILocationActionContext = {},
        // TODO fill in current state's custom state generic from the above router
        newState: Record<string, RouterCurrentStateFromTemplates<CustomTemplates>> = {}
    ): Record<string, RouterCurrentStateFromTemplates<CustomTemplates>> {
        if (!router) {
            return;
        }

        // Call the routers reducer to calculate its state from the new location
        const a = router.reducer(location, router, ctx);
        newState[router.name] = a;

        // Recursively call all children to add their state to the `newState` object
        objKeys(router.routers).forEach(type => {
            router.routers[type].forEach(childRouter =>
                this.calcNewRouterState(
                    location,
                    // cast to be any router instance
                    childRouter, // as RouterInstance<AllTemplates<CustomTemplates>>,
                    ctx,
                    newState
                )
            );
        });

        return newState;
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
            manager: this,
            root: this.rootRouter,
            getState: this.routerStateStore.createRouterStateGetter(name),
            subscribe: this.routerStateStore.createRouterStateSubscriber(name),
            actions,
            cache: this.routerCacheClass
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
        const s = initalArgs;
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
    }: IRouterCreationInfo<AllTemplates<CustomTemplates>, Name>): RouterInstance<
        AllTemplates<CustomTemplates>,
        Name
    > {
        this.validateRouterCreationInfo(name, type, config);

        const initalArgs = this.createNewRouterInitArgs({name, config, type, parentName});
        return this.createRouterFromInitArgs({...initalArgs});
    }
}

const test = new Manager<{custom: DefaultTemplates['stack']}>({} as any);
test.rootRouter.routers['custom'];
test.rootRouter;
test.routers;
const b = new test.routerTypes.custom({} as any);
b.toBack;
