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
    ActionWraperFnDecorator,
    ActionStep
} from './types';
import {
    attemptToShowChildRouters,
    attemptToHideChildRouters,
    attemptToShowParentRouter,
    bindTracerSessionToActionContext,
    attemptToRemoveRouterCache,
    endTracerThing,
    endTracerSession,
    printTracerSessionResults,
    saveNewLocation,
    fetchExistingLocation,
    logTracerStep,
    callActionFn,
    bindActionNameAndActionFnToActionContext,
    bindUserOptionsToLocationOptions,
    startRouterCacheTransaction,
    stopRouterCacheTransaction,
    addRouterCacheToLocation
} from './action_steps';

const createActionStepReducer = <
    CustomTemplates extends IRouterTemplates,
    Name extends NarrowRouterTypeName<keyof (AllTemplates<CustomTemplates>)>
>(
    options: IRouterActionOptions,
    routerInstance: RouterInstance<AllTemplates<CustomTemplates>, Name>
) => ({location, ctx}: ReturnType<ActionStep>, fn: ActionStep) => {
    return fn(options, location, routerInstance, ctx);
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
const createActionExecutor = <CustomTemplates extends IRouterTemplates>(
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
        inputCtx: ILocationActionContext = {actionName}
    ): IInputLocation {
        const actionStepReducer = createActionStepReducer(options, routerInstance);

        const initialSetup = [
            bindTracerSessionToActionContext, // Bind tracer for this router to the action call context
            bindActionNameAndActionFnToActionContext({actionName, actionFn})
        ].reduce(actionStepReducer, {
            location: existingLocation,
            ctx: inputCtx
        });

        // If called from by another router's action
        if (existingLocation) {
            const {location: updatedLocation} = [
                logTracerStep('Called indirectly (from neighboring router)'),
                attemptToHideChildRouters,
                attemptToShowParentRouter,
                callActionFn,
                attemptToShowChildRouters,
                endTracerThing
            ].reduce(actionStepReducer, initialSetup);

            return {...updatedLocation};
        }

        // If called direclty by a user
        const {location: finalLocation} = [
            logTracerStep('Called directly'),
            startRouterCacheTransaction,
            fetchExistingLocation,
            attemptToShowParentRouter,
            attemptToHideChildRouters,
            callActionFn,
            attemptToRemoveRouterCache,
            attemptToShowChildRouters,
            bindUserOptionsToLocationOptions,
            addRouterCacheToLocation,
            stopRouterCacheTransaction,
            endTracerThing,
            endTracerSession,
            // printTracerSessionResults,
            saveNewLocation
        ].reduce(actionStepReducer, initialSetup);

        routerInstance.manager.incrementActionCount();

        // Return location so the function signature of the action is the same
        return {...finalLocation};
    }

    if (actionFnDecorator) {
        return actionFnDecorator(actionWrapper as RouterActionFn);
    }
    return actionWrapper as RouterActionFn;
};

export default createActionExecutor;
