import {
    NarrowRouterTypeName,
    AllTemplates,
    RouterInstance,
    ILocationActionContext,
    IRouterTemplates,
    ActionStep
} from '../types';
import {objKeys} from '../utilities';

const calculateIfVisibleStateShouldBeCached = <
    CustomTemplates extends IRouterTemplates,
    Name extends NarrowRouterTypeName<keyof AllTemplates<CustomTemplates>>
>(
    router: RouterInstance<AllTemplates<CustomTemplates>, Name>,
    ctx: ILocationActionContext
): ILocationActionContext => {
    // Figure out if caching should occur:
    // If the user hasn't set anything, we should fall back to the
    // context object and inherit the setting from the parent.
    // If the parent hasn't set a setting we are probably at root of the action call
    // and should fall back to using the template.
    const disableCaching =
        router.config.disableCaching !== undefined
            ? router.config.disableCaching
            : ctx.disableCaching || router.lastDefinedParentsDisableChildCacheState || false;

    const hasChildren =
        router.routers &&
        Object.values(router.routers).reduce(
            (childrenExist, children) => (children.length && children.length > 0) || childrenExist,
            false
        );
    if (hasChildren) {
        ctx.tracer &&
            ctx.tracer.logStep(
                `Passing to children the ctx state: 'disableCaching' = ${disableCaching}`,
                {disableCaching}
            );
    }
    return {...ctx, disableCaching};
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
 */
const attemptToHideChildRouters: ActionStep = (options, existingLocation, router, ctx) => {
    if (ctx.actionName !== 'hide') {
        return {location: existingLocation, ctx};
    }

    ctx.tracer && ctx.tracer.logStep(`Calling 'attemptToHideChildRouters'`);

    // Update ctx object's caching setting for this branch of the router tree
    const newCtx = calculateIfVisibleStateShouldBeCached(router, ctx);

    // Iterate over children, hiding visible children and caching the fact that they were previously visible.
    const locationFromChildren = objKeys(router.routers).reduce(
        (locationFromChildrenAcc, routerType) => {
            return router.routers[routerType].reduce((locationFromSpecificChildAcc, child) => {
                // Call location 'hide' action if the child is visible
                const childTracer = router.manager.tracerSession.tracerThing(child.name);
                ctx.tracer.logStep(`Looking at child: ${child.name}`);

                if (child.state.visible) {
                    childTracer.logStep(`Calling actionFn: 'hide'`);
                    return child.hide({}, locationFromSpecificChildAcc, child, newCtx);
                } else {
                    childTracer.logStep(`Not calling 'hide' b/c its hidden already`);
                    return locationFromSpecificChildAcc;
                }
            }, locationFromChildrenAcc);
        },
        existingLocation
    );

    // The `options.disableCaching` gives the caller of the direct action
    // the ability to disable caching on a case by case basis will interacting
    // with the router tree. We only want `options.disableCaching` to affect the immediate
    // router. If we want to disable caching for all routers use the ctx object
    // For example, `scene` routers use the `options.disableCaching` to disable sibling caches
    // so they don't get reshown when a parent causes a rehydration
    const shouldCache = !ctx.disableCaching && !(options.disableCaching || false);

    if (shouldCache && !router.manager.routerCache.wasVisible(router.name)) {
        ctx.tracer.logStep(`Caching state`, {shouldCache});
        // if (this.wasVisible) {
        //     return;
        // }

        // If the router exists in the current location, its visible
        const visible = !!router.getLocationDataFromLocationObject({...locationFromChildren});

        if (options.dryRun) {
            ctx.tracer.logStep(`Not setting data in cache because 'dryRun' is enabled`);
        } else {
            router.manager.routerCache.setCache(router.name, {visible, data: options.data});
        }
    } else {
        ctx.tracer.logStep(`Not Caching state`, {shouldCache});
    }

    return {location: locationFromChildren, ctx};
};

export default attemptToHideChildRouters;
