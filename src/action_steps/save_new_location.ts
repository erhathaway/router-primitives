import {ActionStep} from '../types';

const saveNewLocation: ActionStep = (options, location, router, ctx) => {
    if (options.dryRun) {
        ctx.tracer.logStep(
            `Not saving location to serialized state store because 'dryRun' is enabled`
        );
    } else {
        ctx.tracer.logStep(`Saving location to serialized state store`);
        router.manager.serializedStateStore.setState({...location});
    }
    return {location, ctx};
};

export default saveNewLocation;
