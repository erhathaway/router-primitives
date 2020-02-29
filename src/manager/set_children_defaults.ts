import {
    NarrowRouterTypeName,
    AllTemplates,
    IRouterTemplates,
    IRouterActionOptions,
    IInputLocation,
    ILocationActionContext,
    DefaultRouterActions,
    RouterInstance
} from '../types';
import {objKeys} from '../utilities';

const setChildrenDefaults = <
    CustomTemplates extends IRouterTemplates,
    Name extends NarrowRouterTypeName<keyof (AllTemplates<CustomTemplates>)>
>(
    options: IRouterActionOptions,
    existingLocation: IInputLocation,
    router: RouterInstance<AllTemplates<CustomTemplates>, Name>,
    ctx: ILocationActionContext
): IInputLocation => {
    return objKeys(router.routers).reduce((newLocationFromAllRouters, routerType) => {
        // skip routers that called the parent router
        if (routerType === ctx.activatedByChildType) {
            ctx.tracer &&
                ctx.tracer.logStep(
                    `Not calling child router type: ${routerType} b/c it is the same type of activation origin`
                );

            return newLocationFromAllRouters;
        }

        return router.routers[routerType].reduce((newLocationForSpecificChild, child) => {
            const childTracer = router.manager.tracerSession.tracerThing(child.name);

            // prevent inverse activation if it is turned off
            if (ctx.callDirection === 'up' && child.config.shouldInverselyActivate === false) {
                childTracer.logStep(
                    `Not calling child router b/c it is not inversely active: ${child.name}`
                );
                return newLocationForSpecificChild;
            }

            const newContext: ILocationActionContext = {
                ...ctx,
                addingDefaults: true,
                activatedByChildType: undefined,
                callDirection: 'down'
            }; // TODO check if it makes sense to move addingDefaults to options

            // if the cached visibility state is 'false' don't show on rehydration
            // if (child.cache.wasVisible === false) {
            //     console.log(`Not calling router b/c has no cache indicating previous visibility: ${child.name}`)

            //     // return;
            //     if (child.config.defaultAction && child.config.defaultAction.length > 0) {
            //         const [action, ...args] = child.config.defaultAction;
            //         console.log(`Applying default action: ${action} for ${child.name}`)

            //         newLocation = (child as any)[action](
            //             { ...options, data: args[0] }, // TODO pass more than just the first arg
            //             newLocation,
            //             child,
            //             newContext
            //         );
            //     }
            // }

            // if there is a cache state, show the router
            if (child.cache.wasVisible === true) {
                // the cache has been 'used' so remove it
                child.cache.removeCache();
                ctx.tracer &&
                    ctx.tracer.logStep(
                        `Calling show action of child router (${child.name}) b/c it has a cached previous visibility`
                    );

                return child.show(
                    {...options, data: child.cache.previousData},
                    newLocationForSpecificChild,
                    child,
                    newContext
                );
            }

            // if the cached visibility state is 'false' don't show on rehydration
            else if (child.cache.wasVisible === false) {
                ctx.tracer &&
                    ctx.tracer.logStep(
                        `Skipping show action of child router (${child.name}) b/c it wasn't previously visible`
                    );
                return newLocationForSpecificChild;
            }

            //  if there is no cache state and there is a default action, apply the action
            else if (child.config.defaultAction && child.config.defaultAction.length > 0) {
                const [action, ...args] = child.config.defaultAction;
                ctx.tracer &&
                    ctx.tracer.logStep(
                        `No cached state found, but default action found. Applying default action: ${action} for ${child.name}`
                    );

                return child[action as keyof DefaultRouterActions](
                    {...options, data: args[0]}, // TODO pass more than just the first arg
                    newLocationForSpecificChild,
                    child,
                    newContext
                );
            }
            return newLocationFromAllRouters;
        }, newLocationFromAllRouters);
    }, existingLocation);
};

export default setChildrenDefaults;
