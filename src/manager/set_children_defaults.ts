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
    location: IInputLocation,
    router: RouterInstance<AllTemplates<CustomTemplates>, Name>,
    ctx: ILocationActionContext
): IInputLocation => {
    const tracerSession = router.manager.tracerSession;
    const tracer = tracerSession.tracerThing(router.name);

    let newLocation = {...location};
    // TODO don't mutate location
    objKeys(router.routers).forEach(routerType => {
        // skip routers that called the parent router
        if (routerType === ctx.activatedByChildType) {
            tracer.logStep(
                `Not calling child router type: ${routerType} b/c it is the same type of activation origin`
            );

            return;
        }

        router.routers[routerType].forEach(child => {
            const childTracer = tracerSession.tracerThing(child.name);

            // prevent inverse activation if it is turned off
            if (ctx.callDirection === 'up' && child.config.shouldInverselyActivate === false) {
                // console.log(`Not calling router b/c not inversely active: ${child.name}`)
                childTracer.logStep(
                    `Not calling child router b/c it is not inversely active: ${child.name}`
                );
                return;
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
                tracer.logStep(
                    `Calling show action of child router b/c it has a cached previous visibility: ${child.name}`
                );

                newLocation = child.show(options, newLocation, child, newContext);
            }

            // if the cached visibility state is 'false' don't show on rehydration
            // or if there is no cache state and there is a default action, apply the action
            else if (child.config.defaultAction && child.config.defaultAction.length > 0) {
                const [action, ...args] = child.config.defaultAction;
                tracer.logStep(`(Applying default action: ${action} for ${child.name}`);

                newLocation = child[action as keyof DefaultRouterActions](
                    {...options, data: args[0]}, // TODO pass more than just the first arg
                    newLocation,
                    child,
                    newContext
                );
            }
        });
    });

    return newLocation;
};

export default setChildrenDefaults;
