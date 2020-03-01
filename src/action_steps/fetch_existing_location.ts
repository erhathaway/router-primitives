import {ActionStep} from '../types';

const fetchExistingLocation: ActionStep = (_options, _location, router, ctx) => {
    ctx.tracer.logStep(`Fetching existing location from serialized state store`);
    const existingLocation = router.manager.serializedStateStore.getState();

    return {location: existingLocation, ctx};
};

export default fetchExistingLocation;
