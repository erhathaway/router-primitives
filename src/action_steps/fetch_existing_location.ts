import {ActionStep, IInputLocation} from '../types';

const fetchExistingLocation: ActionStep = (_options, _location, router, ctx) => {
    ctx.tracer.logStep(`Fetching existing location from serialized state store`);
    const existingLocation = router.manager.serializedStateStore.getState() as IInputLocation;

    return {location: existingLocation, ctx};
};

export default fetchExistingLocation;
