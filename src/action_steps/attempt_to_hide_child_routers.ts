import {ActionStep} from '../types';
import {objKeys} from '../utilities';
import {addRealDisableCacheFlagToContext, calculateIfShouldUseCache} from './utils';

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
    const newCtx = addRealDisableCacheFlagToContext(router, ctx);

    // Iterate over children, hiding visible children and caching the fact that they were previously visible.
    const locationFromChildren = objKeys(router.routers).reduce(
        (locationFromChildrenAcc, routerType) => {
            return router.routers[routerType].reduce((locationFromSpecificChildAcc, child) => {
                // Call location 'hide' action if the child is visible
                const childTracer = router.manager.tracerSession.tracerThing(child.name);
                ctx.tracer.logStep(`Looking at child: ${child.name}`);

                if (child.state.visible) {
                    childTracer.logStep(`Calling actionFn: 'hide'`);
                    // don't pass options b/c we don't want them propagating to other routers. only context propagates to other routers
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
    // the ability to disable caching on a case by case basis.
    // We only want `options.disableCaching` to affect the immediate
    // router. If we want to disable caching for all routers use the ctx object
    // For example, `scene` routers use the `options.disableCaching` to disable sibling caches
    // so they don't get re-shown when a parent causes a rehydration

    const shouldCache = calculateIfShouldUseCache(newCtx, options);

    if (shouldCache && !router.manager.routerCache.wasVisible(router.name)) {
        // If the router exists in the current location, its visible
        const visible = !!router.getLocationDataFromLocationObject({...locationFromChildren});

        if (options.dryRun) {
            ctx.tracer.logStep(`Not caching state because 'dryRun' is enabled`);
        } else {
            ctx.tracer.logStep(`Caching state`, {shouldCache});
            // console.log('caching router name: ', router.name, options, ctx, router.data);
            router.manager.routerCache.setCache(router.name, {
                visible,
                data: router.data // ctx.pathData ? (ctx.pathData[router.name] as any) : undefined
            });
        }
    } else {
        ctx.tracer.logStep(`Not Caching state`, {shouldCache});
    }

    return {location: locationFromChildren, ctx};
};

export default attemptToHideChildRouters;
