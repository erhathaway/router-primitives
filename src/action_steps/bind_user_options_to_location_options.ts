import {ActionStep} from '../types';

const bindUserOptionsToLocationOptions: ActionStep = (userOptions, location, _router, ctx) => {
    ctx.tracer.logStep('Adding user options to location');

    location.options = {
        ...location.options,
        ...userOptions
    };
    return {location, ctx};
};

export default bindUserOptionsToLocationOptions;
