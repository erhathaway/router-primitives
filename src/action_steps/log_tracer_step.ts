import {ActionStep} from '../types';

const logTracerStep: (stepLog: string) => ActionStep = stepLog => (
    _options,
    location,
    _router,
    ctx
) => {
    ctx.tracer.logStep(stepLog);

    return {location, ctx};
};

export default logTracerStep;
