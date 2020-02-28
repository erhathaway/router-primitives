import {
    NarrowRouterTypeName,
    AllTemplates,
    IRouterActionOptions,
    IInputLocation,
    RouterInstance,
    ILocationActionContext,
    IRouterTemplates
} from '../types';
import {objKeys} from '../utilities';

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
const setCacheAndHide = <
    CustomTemplates extends IRouterTemplates,
    Name extends NarrowRouterTypeName<keyof (AllTemplates<CustomTemplates>)>
>(
    options: IRouterActionOptions,
    location: IInputLocation,
    router: RouterInstance<AllTemplates<CustomTemplates>, Name>,
    ctx: ILocationActionContext
): IInputLocation => {
    // const tracerSession = router.manager.tracerSession;
    // const tracer = tracerSession.tracerThing(router.name);

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
    const hasChildren =
        router.routers &&
        Object.values(router.routers).reduce(
            (childrenExist, children) => (children.length && children.length > 0) || childrenExist,
            false
        );
    if (hasChildren) {
        ctx.tracer.logStep(
            `Passing to children the ctx state: 'disableCaching' = ${disableCaching}`,
            {disableCaching}
        );
    }
    objKeys(router.routers).forEach(routerType => {
        router.routers[routerType].forEach(child => {
            // Update ctx object's caching setting for this branch of the router tree
            const newCtx = {...ctx, disableCaching};

            // Call location 'hide' action if the child is visible
            const childTracer = router.manager.tracerSession.tracerThing(child.name);
            ctx.tracer.logStep(`Looking at child: ${child.name}`);

            if (child.state.visible) {
                childTracer.logStep(`Calling actionFn: 'hide'`);
                newLocation = child.hide({}, newLocation, child, newCtx);
            } else {
                childTracer.logStep(`Not calling 'hide' b/c its hidden already`);
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
    if (shouldCache) {
        ctx.tracer.logStep(`Caching state`, {shouldCache});
    } else {
        ctx.tracer.logStep(`Not Caching state`, {shouldCache});
    }

    // console.log(`SHOULD CACHE: ${router.name}`, shouldCache, disableCaching, options.disableCaching)
    if (shouldCache) {
        // console.log(`Cache: storing was previously visible for router: ${router.name}`)
        // router.cache.setWasPreviouslyVisibleToFromLocation(newLocation as any, router as any)
        router.cache.setWasPreviouslyVisibleToFromLocation(newLocation, router);
    }

    return newLocation;
};

export default setCacheAndHide;
