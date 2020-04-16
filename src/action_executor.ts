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
    ActionStep,
    RouterCustomStateFromTemplates
} from './types';
import {
    attemptToShowChildRouters,
    attemptToHideChildRouters,
    attemptToShowParentRouter,
    bindTracerSessionToActionContext,
    bindDryRunToActionContext,
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
import bindPathDataToContext from './action_steps/bind_path_data_to_context';
import addReplaceLocationOptionToLocation from './action_steps/add_replace_location_option_to_location';
import bindDefaultActionDataToContext from './action_steps/bind_default_action_data_to_context';
import validateExistenceOfData from './action_steps/validate_existence_of_data';

const createActionStepReducer = <
    CustomTemplates extends IRouterTemplates,
    Name extends NarrowRouterTypeName<keyof AllTemplates<CustomTemplates>>
>(
    options: IRouterActionOptions<RouterCustomStateFromTemplates<AllTemplates<CustomTemplates>>>,
    routerInstance: RouterInstance<CustomTemplates, Name>
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
const createActionExecutor = <
    CustomTemplates extends IRouterTemplates,
    Name extends NarrowRouterTypeName<keyof AllTemplates<CustomTemplates>>
>(
    actionFn: RouterActionFn<CustomTemplates, Name>,
    actionName: string,
    actionFnDecorator?: ActionWraperFnDecorator<CustomTemplates, Name>,
    actionExecutorOptions?: {printerTracerResults?: boolean}
): RouterActionFn<CustomTemplates, Name> => {
    function actionWrapper(
        options: IRouterActionOptions<
            RouterCustomStateFromTemplates<AllTemplates<CustomTemplates>>
        > = {},
        existingLocation?: IOutputLocation,
        routerInstance: RouterInstance<CustomTemplates, Name> = this,
        inputCtx: ILocationActionContext<CustomTemplates, Name> = {actionName}
    ): IInputLocation {
        const actionStepReducer = createActionStepReducer(options, routerInstance);

        const initialSetup = [
            bindTracerSessionToActionContext, // Bind tracer for this router to the action call context
            bindActionNameAndActionFnToActionContext({actionName, actionFn}),
            bindDryRunToActionContext
        ].reduce(actionStepReducer, {
            location: existingLocation,
            ctx: inputCtx
        });

        // If called from by another router's action
        if (existingLocation) {
            const {location: updatedLocation} = [
                logTracerStep('Called indirectly (from neighboring router)'),
                bindDefaultActionDataToContext,
                bindPathDataToContext,
                attemptToShowParentRouter,
                attemptToHideChildRouters,
                validateExistenceOfData,
                callActionFn,
                attemptToShowChildRouters,
                endTracerThing
            ].reduce(actionStepReducer, initialSetup);

            return {...updatedLocation};
        }

        const printerTracerResults =
            actionExecutorOptions && actionExecutorOptions.printerTracerResults === true
                ? [printTracerSessionResults]
                : [];

        // If called directly by a user
        const {location: finalLocation} = [
            logTracerStep('Called directly'),
            startRouterCacheTransaction,
            fetchExistingLocation,
            addReplaceLocationOptionToLocation,
            bindPathDataToContext,
            bindDefaultActionDataToContext,
            attemptToShowParentRouter,
            attemptToHideChildRouters,
            validateExistenceOfData,
            /**
             * All action options should have been added to the context.
             */
            callActionFn,
            /**
             * If can have a catch state, record that this
             * router was directly hidden. We want a cache state of 'wasVisible = false'
             * b/c if we just removed the cache, any 'show' actions could trigger 'defaultAction's
             * and we only want a defaultAction to run when the router hasn't been touched yet or
             * if it has no cache
             */
            attemptToRemoveRouterCache,
            attemptToShowChildRouters,
            bindUserOptionsToLocationOptions,
            // do before ending cache transaction b/c for dry runs,
            // the cache will be discarded
            addRouterCacheToLocation,
            stopRouterCacheTransaction,
            endTracerThing,
            endTracerSession,
            ...printerTracerResults,
            saveNewLocation
        ].reduce(actionStepReducer, initialSetup);

        routerInstance.manager.incrementActionCount();

        // Return location so the function signature of the action is the same
        return {...finalLocation};
    }

    if (actionFnDecorator) {
        return actionFnDecorator(actionWrapper);
    }
    return actionWrapper;
};

export default createActionExecutor;
