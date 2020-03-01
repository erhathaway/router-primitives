import {ActionStep} from '../types';
import {objKeys} from '../utilities';
import {ITracerThing, tracerManager} from '../tracer';

const bindTracerSessionToActionContext: ActionStep = (
    _options,
    existingLocation,
    routerInstance,
    ctx
) => {
    if (!existingLocation) {
        if (routerInstance.manager.tracerSession) {
            routerInstance.manager.tracerSession.end();
            routerInstance.manager.tracerSession.removeAllSubscriptions();
        }
        routerInstance.manager.tracerSession = tracerManager.newSession('Action started');
        objKeys(routerInstance.manager.routers).forEach(routerName => {
            const r = routerInstance.manager.routers[routerName];
            const tracerUpdateFn = (thingInfo: ITracerThing): void => {
                r.EXPERIMENTAL_setInternalState({...thingInfo});

                // console.log(`(${r.name}) active:`, r.state.isActive); // tslint:disable-line
            };
            routerInstance.manager.tracerSession.subscribeToThing(routerName, tracerUpdateFn);
        });
    }

    ctx.tracer = routerInstance.manager.tracerSession.tracerThing(routerInstance.name);
    return {location: existingLocation, ctx: {...ctx}};
};

export default bindTracerSessionToActionContext;
