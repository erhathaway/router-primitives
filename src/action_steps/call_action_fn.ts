import {ActionStep} from '../types';

const callActionFn: ActionStep = (options, location, router, ctx) => {
    // if a parent or the current router is missing data we don't want to apply
    // location changes for the router or any of its children
    if (ctx.routerIsMissingData) {
        ctx.tracer &&
            ctx.tracer.logStep(
                `Not calling 'attemptToShowChildRouters' because the current router or a parent is missing data`
            );

        return {location, ctx};
    }
    ctx.tracer.logStep(`Calling actionFn: ${ctx.actionName}`);
    // We pass options to the direct action function but not to children or parents.
    // Context is used to pass info to parents and children
    const locationFromAction = ctx.actionFn(options, location, router, {
        ...ctx,
        callDirection: 'lateral'
    });
    return {location: locationFromAction, ctx};
};

export default callActionFn;
