import {
    RouterActionFn,
    NarrowRouterTypeName,
    AllTemplates,
    IRouterTemplates,
    IRouterActionOptions,
    IOutputLocation,
    RouterInstance,
    ILocationActionContext,
    IInputLocation
} from '../types';
import {objKeys} from '../utilities';
import {ITracerThing, TracerSession, tracerManager} from '../tracer';

const createActionWrapperFunction = <
    CustomTemplates extends IRouterTemplates,
    WrappedFn extends RouterActionFn,
    ReturnedFn extends RouterActionFn
>(
    actionFn: WrappedFn,
    actionName: string
): ReturnedFn => {
    function actionWrapper<
        Name extends NarrowRouterTypeName<keyof (AllTemplates<CustomTemplates>)>
    >(
        options: IRouterActionOptions = {},
        existingLocation?: IOutputLocation,
        routerInstance: RouterInstance<AllTemplates<CustomTemplates>, Name> = this,
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
                    {...ctx, callDirection: 'up', activatedByChildType: routerInstance.type}
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
        updatedLocation = routerInstance.manager.serializedStateStore.getState();

        // if the parent router isn't visible, but the child is shown, show all parents
        if (
            actionName === 'show' &&
            routerInstance.parent &&
            (routerInstance.parent.state.visible === false ||
                routerInstance.parent.state.visible === undefined) &&
            ctx.callDirection !== 'down'
        ) {
            tracer.logStep(`Calling 'show' action of router parent: ${routerInstance.parent.name}`);

            // console.log(`(start) Calling parent of router: ${routerInstance.name} ---- ${routerInstance.parent.name}`)

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
        routerInstance.manager.serializedStateStore.setState({...updatedLocation});
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
        // objKeys(things).forEach(tName => console.log(tName, things[tName].isActive)) // tslint:disable-line
        return {...updatedLocation};
    }

    if (this.actionFnDecorator) {
        return this.actionFnDecorator(actionWrapper) as ReturnedFn;
    }
    return actionWrapper as ReturnedFn;
};
