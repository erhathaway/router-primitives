import {ActionStep} from '../types';
import {addRealDisableCacheFlagToContext, calculateIfShouldUseCache} from './utils';

const attemptToRemoveRouterCache: ActionStep = (options, existingLocation, routerInstance, ctx) => {
    if (
        ctx.actionName === 'hide' && // want to hide router
        routerInstance.state.visible === true // currently visible
    ) {
        if (options.dryRun) {
            ctx.tracer.logStep(
                `Not setting wasVisible to false in cache because 'dryRun' is enabled`
            );
        } else {
            const newCtx = addRealDisableCacheFlagToContext(routerInstance, ctx);
            const shouldCache = calculateIfShouldUseCache(newCtx, options);
            if (shouldCache) {
                ctx.tracer && ctx.tracer.logStep('Setting wasVisible to false in router cache');
                routerInstance.manager.routerCache.setCache(routerInstance.name, {
                    visible: false,
                    data: options.data
                });
            } else {
                ctx.tracer &&
                    ctx.tracer.logStep('Skipping setting wasVisible to false in router cache');
            }
        }
    }

    return {location: existingLocation, ctx: {...ctx}};
};

export default attemptToRemoveRouterCache;
