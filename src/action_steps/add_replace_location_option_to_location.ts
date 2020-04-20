import {ActionStep} from '../types';

const addReplaceLocationOptionToLocation: ActionStep = (options, location, _router, ctx) => {
    if (options.replaceLocation) {
        ctx.tracer.logStep(`Adding replaceLocation option to the location`);

        const locationOptions =
            options && options.replaceLocation !== undefined
                ? {...location.options, replaceLocation: options.replaceLocation}
                : {...location.options};
        return {location: {...location, options: locationOptions}, ctx: {...ctx}};
    }
    return {location, ctx};
};

export default addReplaceLocationOptionToLocation;
