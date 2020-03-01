import {ActionStep} from '../types';

const saveNewLocation: ActionStep = (_options, location, router, ctx) => {
    ctx.tracer.logStep(`Saving location to serialized state store`);
    router.manager.serializedStateStore.setState({...location});

    return {location, ctx};
};

export default saveNewLocation;
