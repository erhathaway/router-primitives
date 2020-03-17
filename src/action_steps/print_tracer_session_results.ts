import {ActionStep} from '../types';
import {objKeys} from '../utilities';
import {serializer} from '../serialized_state';

const logTracerSteps: ActionStep = (_options, location, routerInstance, ctx) => {
    console.log(
        'TOTAL TIME',
        routerInstance.manager.tracerSession.endTime -
            routerInstance.manager.tracerSession.startTime
    );
    const tracerThings = routerInstance.manager.tracerSession.tracerThings || {};
    const combinedSteps = objKeys(tracerThings).reduce((acc, routerName) => {
        const thingSteps = tracerThings[routerName].steps.map(s => ({...s, routerName}));
        return acc.concat(thingSteps);
    }, []);
    const sortedCombinedSteps = combinedSteps
        .sort((a, b) => a.time - b.time)
        .map(s => `${s.routerName}: ${s.name}`);
    console.log('steps: ', sortedCombinedSteps);
    console.log(routerInstance.manager.tracerSession);
    console.log('NEW LOCATION', serializer(location));
    return {location, ctx};
};

export default logTracerSteps;
