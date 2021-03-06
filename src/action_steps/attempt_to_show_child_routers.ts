import {ILocationActionContext, DefaultRouterActions, ActionStep} from '../types';
import {objKeys} from '../utilities';

const attemptToShowChildRouters: ActionStep = (options, location, router, ctx) => {
    const newLocation = objKeys(router.children).reduce((newLocationFromAllRouters, routerType) => {
        // skip routers that called the parent router
        if (
            routerType === ctx.activatedByChildType &&
            !router.config.shouldParentTryToActivateSiblings
        ) {
            ctx.tracer &&
                ctx.tracer.logStep(
                    `Not calling children of type ${routerType} b/c they are the same type as activation origin`
                );

            return newLocationFromAllRouters;
        }

        return router.children[routerType].reduce((newLocationForSpecificChild, child) => {
            // prevent inverse activation if it is turned off
            if (ctx.callDirection === 'up' && child.config.shouldInverselyActivate === false) {
                ctx &&
                    ctx.tracer.logStep(
                        `Not calling child (${child.name}) b/c it is not inversely active`
                    );
                return newLocationForSpecificChild;
            }

            const newContext: ILocationActionContext<
                any,
                any // InferCustomTemplatesFromRouter<typeof router>,
                // NarrowRouterTypeName<InferNameFromRouter<typeof router>>
            > = {
                ...ctx,
                addingDefaults: true,
                activatedByChildType: undefined,
                callDirection: 'down'
            };

            // if there is a cache state, show the router
            if (child.manager.routerCache.wasVisible(child.name) === true) {
                // the cache has been 'used' so remove it
                if (options.dryRun) {
                    ctx.tracer.logStep(`Not removing cache because 'dryRun' is enabled`);
                } else {
                    ctx.tracer.logStep(`Removing cache`);
                    child.manager.routerCache.removeCache(child.name);
                }
                ctx.tracer &&
                    ctx.tracer.logStep(
                        `Calling show action of child (${child.name}) b/c it has a cached previous visibility`
                    );

                return child.show(
                    {...options, data: child.manager.routerCache.previousData(child.name)},
                    newLocationForSpecificChild,
                    child,
                    newContext // pass a modified context down but dont let children share context
                );
            }

            // if the cached visibility state is 'false' don't show on rehydration
            else if (child.manager.routerCache.wasVisible(child.name) === false) {
                ctx.tracer &&
                    ctx.tracer.logStep(
                        `Skipping show action of child (${child.name}) b/c it wasn't previously visible`
                    );
                return newLocationForSpecificChild;
            }

            //  if there is no cache state and there is a default action, apply the action
            else if (child.config.defaultAction && child.config.defaultAction.length > 0) {
                const [action, ...args] = child.config.defaultAction;
                ctx.tracer &&
                    ctx.tracer.logStep(
                        `No cached state found for ${child.name}, but default action found. Applying default action: ${action} for ${child.name}`
                    );

                return child[action as keyof DefaultRouterActions<any, any>](
                    {...options, data: args[0]}, // TODO pass more than just the first arg
                    newLocationForSpecificChild,
                    child,
                    newContext
                );
            }
            return newLocationForSpecificChild;
        }, newLocationFromAllRouters);
    }, location);

    return {location: newLocation, ctx};
};

const attemptToShowChildRoutersMain: ActionStep = (options, location, routerInstance, ctx) => {
    const hasChildren =
        routerInstance.children &&
        Object.values(routerInstance.children).reduce(
            (childrenExist, children) => (children.length && children.length > 0) || childrenExist,
            false
        );
    if (ctx.actionName === 'show' && hasChildren) {
        // if a parent or the current router is missing data we don't want to apply
        // location changes for the router or any of its children
        if (ctx.routerIsMissingData) {
            ctx.tracer &&
                ctx.tracer.logStep(
                    `Not calling 'attemptToShowChildRouters' because the current router or a parent is missing data`
                );

            return {location, ctx};
        }

        ctx.tracer && ctx.tracer.logStep(`Calling 'attemptToShowChildRouters'`);

        // add location defaults from children
        return attemptToShowChildRouters(options, {...location}, routerInstance, ctx);
    }
    return {location, ctx};
};

export default attemptToShowChildRoutersMain;
