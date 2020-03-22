import {ActionStep} from '../types';

const attemptToRemoveRouterCache: ActionStep = (options, existingLocation, routerInstance, ctx) => {
    if (ctx.actionName === 'hide' && routerInstance.state.visible === true) {
        if (options.dryRun) {
            ctx.tracer.logStep(
                `Not setting wasVisible to false in cache because 'dryRun' is enabled`
            );
        } else {
            ctx.tracer && ctx.tracer.logStep('Setting wasVisible to false in router cache');
            routerInstance.manager.routerCache.setCache(routerInstance.name, {
                visible: false,
                data: options.data
            });
            if (routerInstance.name === 'data3') {
                console.log('data3 --cache', routerInstance.manager.routerCache.cache['data3']);
            }
        }
    }

    return {location: existingLocation, ctx: {...ctx}};
};

export default attemptToRemoveRouterCache;
