import {ActionStep} from '../types';

const endTracerSession: ActionStep = (_options, location, routerInstance, ctx) => {
    routerInstance.manager.tracerSession.endWithMessage('Action complete');

    return {location, ctx};
};

export default endTracerSession;
