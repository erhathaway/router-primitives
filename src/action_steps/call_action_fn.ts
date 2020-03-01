import {ActionStep} from '../types';

const saveLocation: ActionStep = (options, location, router, ctx) => {
    ctx.tracer.logStep(`Calling actionFn: ${ctx.actionName}`);
    const locationFromAction = ctx.actionFn(options, location, router, {
        ...ctx,
        callDirection: 'lateral'
    });
    return {location: locationFromAction, ctx};
};

export default saveLocation;
