import {
    RouterActionFn,
    NarrowRouterTypeName,
    AllTemplates,
    IRouterTemplates,
    IRouterActionOptions,
    IOutputLocation,
    RouterInstance,
    ILocationActionContext,
    IInputLocation,
    ActionWraperFnDecorator
} from '../types';
import {objKeys} from '../utilities';
import {ITracerThing, tracerManager} from '../tracer';
import {setChildrenDefaults, setCacheAndHide} from './index';

const setCacheAndHideChildRouters = <
    CustomTemplates extends IRouterTemplates,
    Name extends NarrowRouterTypeName<keyof (AllTemplates<CustomTemplates>)>
>(
    options: IRouterActionOptions,
    existingLocation: IInputLocation,
    routerInstance: RouterInstance<AllTemplates<CustomTemplates>, Name>,
    ctx: ILocationActionContext
): IInputLocation => {
    if (ctx.actionName === 'hide') {
        // tracer.logStep('Hiding');
        ctx.tracer && ctx.tracer.logStep(`Calling 'setCacheAndHide'`);

        return setCacheAndHide(options, existingLocation, routerInstance, ctx);
    }
    return {...existingLocation};
};

const checkIfShouldShowParentRouter = <
    CustomTemplates extends IRouterTemplates,
    Name extends NarrowRouterTypeName<keyof (AllTemplates<CustomTemplates>)>
>(
    options: IRouterActionOptions,
    existingLocation: IInputLocation,
    routerInstance: RouterInstance<AllTemplates<CustomTemplates>, Name>,
    ctx: ILocationActionContext
): IInputLocation => {
    if (
        ctx.actionName === 'show' &&
        routerInstance.parent &&
        (routerInstance.parent.state.visible === false ||
            routerInstance.parent.state.visible === undefined) &&
        ctx.callDirection !== 'down'
    ) {
        ctx.tracer &&
            ctx.tracer.logStep(
                `Calling 'show' action of router parent: ${routerInstance.parent.name} `
            );

        // data routers dont have a visibility state by default. TODO FIX THIS
        return routerInstance.parent.show({}, {...existingLocation}, routerInstance.parent, {
            ...ctx,
            callDirection: 'up',
            activatedByChildType: routerInstance.type
        });
    }
    return {...existingLocation};
};

const checkIfShouldShowChildRouters = <
    CustomTemplates extends IRouterTemplates,
    Name extends NarrowRouterTypeName<keyof (AllTemplates<CustomTemplates>)>
>(
    options: IRouterActionOptions,
    existingLocation: IInputLocation,
    routerInstance: RouterInstance<AllTemplates<CustomTemplates>, Name>,
    ctx: ILocationActionContext
): IInputLocation => {
    if (ctx.actionName === 'show') {
        // tracer.logStep(`Calling 'show' action of router's children`);
        ctx.tracer && ctx.tracer.logStep(`Calling 'setChildrenDefaults'`);

        // add location defaults from children
        return setChildrenDefaults(options, {...existingLocation}, routerInstance, ctx);
    }
    return {...existingLocation};
};

const createTracerForRouterInstance = <
    CustomTemplates extends IRouterTemplates,
    Name extends NarrowRouterTypeName<keyof (AllTemplates<CustomTemplates>)>
>(
    routerInstance: RouterInstance<AllTemplates<CustomTemplates>, Name>,
    existingLocation?: IInputLocation
): ITracerThing => {
    if (!existingLocation) {
        if (routerInstance.manager.tracerSession) {
            routerInstance.manager.tracerSession.end();
            routerInstance.manager.tracerSession.removeAllSubscriptions();
            // routerInstance.manager.tracerSession.manager._moveSessionToFinishedStorage(routerInstance.manager.tracerSession)
        }
        routerInstance.manager.tracerSession = tracerManager.newSession('Action started');
        objKeys(routerInstance.manager.routers).forEach(routerName => {
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
            routerInstance.manager.tracerSession.subscribeToThing(routerName, tracerUpdateFn);
        });
    }

    return routerInstance.manager.tracerSession.tracerThing(routerInstance.name);
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
const createActionWrapperFunction = <
    CustomTemplates extends IRouterTemplates
    // WrappedFn extends RouterActionFn,
    // ReturnedFn extends RouterActionFn
>(
    actionFn: RouterActionFn,
    actionName: string,
    actionFnDecorator?: ActionWraperFnDecorator
): RouterActionFn => {
    function actionWrapper<
        Name extends NarrowRouterTypeName<keyof (AllTemplates<CustomTemplates>)>
    >(
        options: IRouterActionOptions = {},
        existingLocation?: IOutputLocation,
        routerInstance: RouterInstance<AllTemplates<CustomTemplates>, Name> = this,
        ctx: ILocationActionContext = {actionName}
    ): IInputLocation {
        // Bind tracer for this router to the action call context
        ctx.tracer = createTracerForRouterInstance(routerInstance, existingLocation);

        // If called from by another router's action
        let updatedLocation: IInputLocation;
        if (existingLocation) {
            ctx.tracer.logStep('Called indirectly (from neighboring router)');

            // set cache before location changes b/c cache info is derived from location path
            const locationFromSettingCacheAndHidingChildRouters = setCacheAndHideChildRouters(
                options,
                existingLocation,
                routerInstance,
                ctx
            );

            // TODO WHY IS THIS NECESSARY??
            // const newLocation = {
            //     ...existingLocation,
            //     ...locationFromSettingCacheAndHidingChildRouters
            // };

            // If the parent router isn't visible, but the child is shown, show all parents
            const locationFromTryingToShowParent = checkIfShouldShowParentRouter(
                options,
                locationFromSettingCacheAndHidingChildRouters,
                routerInstance,
                ctx
            );

            ctx.tracer.logStep(`Calling actionFn: ${actionName}`);

            // Call the router's action after any actions on the parent have been taken care of
            const locationFromAction = actionFn(
                options,
                {...locationFromTryingToShowParent},
                // {...newLocation, ...updatedLocation},
                routerInstance,
                ctx
            );

            // Call actions on the children after this router's action have been taken care of
            const locationFromTryingToShowChildren = checkIfShouldShowChildRouters(
                options,
                locationFromAction,
                routerInstance,
                ctx
            );

            ctx.tracer.endWithMessage(`Returning location`);
            // return {...newLocation, ...locationFromTryingToShowChildren};
            return {...locationFromTryingToShowChildren};
        }

        ctx.tracer.logStep('Called directly');

        // if called directly, fetch location
        updatedLocation = routerInstance.manager.serializedStateStore.getState();

        // if the parent router isn't visible, but the child is shown, show all parents
        if (
            actionName === 'show' &&
            routerInstance.parent &&
            (routerInstance.parent.state.visible === false ||
                routerInstance.parent.state.visible === undefined) &&
            ctx.callDirection !== 'down'
        ) {
            ctx.tracer.logStep(
                `Calling 'show' action of router parent: ${routerInstance.parent.name}`
            );

            // data routers dont have a visibility state by default. TODO FIX THIS
            updatedLocation = routerInstance.parent.show(
                {},
                {...updatedLocation},
                routerInstance.parent,
                {...ctx, callDirection: 'up', activatedByChildType: routerInstance.type}
            );
        }

        // set cache before location changes b/c cache info is derived from location path
        if (actionName === 'hide') {
            // ctx.tracer.logStep('Hiding');
            ctx.tracer.logStep(`Calling 'setCacheAndHide'`);

            updatedLocation = setCacheAndHide(options, {...updatedLocation}, routerInstance, ctx);
        }

        ctx.tracer.logStep(`Calling actionFn: ${actionName}`);

        // Call the router's action after any actions on the parent have been taken care of
        updatedLocation = actionFn(options, {...updatedLocation}, routerInstance, ctx);

        // If this action is a direct call from the user, remove all caching
        if (actionName === 'hide' && routerInstance.state.visible === true) {
            routerInstance.cache.setWasPreviouslyVisibleTo(false);
        }

        if (actionName === 'show') {
            // tracer.logStep(`Calling 'show' action of router's children`);
            ctx.tracer.logStep(`Calling 'setChildrenDefaults'`);

            // add location defaults from children
            updatedLocation = setChildrenDefaults(
                options,
                {...updatedLocation},
                routerInstance,
                ctx
            );
        }

        // add user options to new location options
        updatedLocation.options = {...updatedLocation.options, ...options};

        // set serialized state
        routerInstance.manager.serializedStateStore.setState({...updatedLocation});
        // return location so the function signature of the action is the same
        ctx.tracer.endWithMessage(`Returning location`);
        // setTimeout(() => {
        routerInstance.manager.tracerSession.endWithMessage('Action complete');
        console.log(
            'TOTAL TIME',
            routerInstance.manager.tracerSession.endTime -
                routerInstance.manager.tracerSession.startTime
        );
        const tracerThings = routerInstance.manager.tracerSession.tracerThings || {};
        const combinedSteps = objKeys(tracerThings).reduce((acc, routerName) => {
            const thingSteps = tracerThings[routerName].steps.map(s => ({...s, routerName}));
            return acc.concat(thingSteps);
        }, []);
        const sortedCombinedSteps = combinedSteps
            .sort((a, b) => a.time - b.time)
            .map(s => `${s.routerName}: ${s.name}`);
        console.log('steps: ', sortedCombinedSteps);
        console.log(routerInstance.manager.tracerSession);
        // }, 3000);
        // const things = routerInstance.manager.tracerSession.tracerThings;
        // objKeys(things).forEach(tName => console.log(tName, things[tName].isActive)) // tslint:disable-line
        // console.log('new updatedLocation', updatedLocation);
        return {...updatedLocation};
    }

    if (actionFnDecorator) {
        return actionFnDecorator(actionWrapper as RouterActionFn);
    }
    return actionWrapper as RouterActionFn;
};

export default createActionWrapperFunction;
