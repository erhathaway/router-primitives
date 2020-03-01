import {ActionStep} from '../types';

const endTracerSession: ActionStep = (_options, location, _routerInstance, ctx) => {
    ctx.tracer.endWithMessage(`Returning location`);

    return {location, ctx};
};

export default endTracerSession;
