import {ActionStep} from '../types';

const attemptToRemoveRouterCache: ActionStep = (options, existingLocation, routerInstance, ctx) => {
    if (ctx.actionName === 'hide' && routerInstance.state.visible === true) {
        ctx.tracer && ctx.tracer.logStep('Setting wasVisible to false in router cache');
        routerInstance.cache.setCache({visible: false, data: options.data});
    }

    return {location: existingLocation, ctx: {...ctx}};
};

export default attemptToRemoveRouterCache;
