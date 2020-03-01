import {ActionStep} from '../types';

const attemptToShowParentRouter: ActionStep = (_options, location, routerInstance, ctx) => {
    if (
        ctx.actionName === 'show' &&
        routerInstance.parent &&
        (routerInstance.parent.state.visible === false ||
            routerInstance.parent.state.visible === undefined) &&
        ctx.callDirection !== 'down' &&
        ctx.callDirection !== 'lateral'
    ) {
        ctx.tracer &&
            ctx.tracer.logStep(
                `Calling 'show' action of router parent: ${routerInstance.parent.name} `
            );

        // data routers dont have a visibility state by default. TODO FIX THIS
        const locationFromShowingParent = routerInstance.parent.show(
            {},
            {...location},
            routerInstance.parent,
            {
                ...ctx,
                callDirection: 'up',
                activatedByChildType: routerInstance.type
            }
        );
        return {location: locationFromShowingParent, ctx};
    }
    return {location, ctx};
};

export default attemptToShowParentRouter;
