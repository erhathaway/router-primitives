import {ActionStep} from '../types';

const bindDefaultActionDataToContext: ActionStep = (options, location, router, ctx) => {
    if (options.pathData || options.data) {
        ctx.tracer.logStep(`Pathdata exists not - binding default action to the context`);

        const pathData = {
            [router.name]: options.data,
            ...options.pathData
        };

        return {location: {...location}, ctx: {...ctx, pathData}};
    } else if (
        (!ctx.pathData || !ctx.pathData[router.name]) &&
        router.manager.routerCache.cache[router.name] === undefined &&
        router.config.defaultAction &&
        router.config.defaultAction.length > 0 &&
        router.config.defaultAction[0] === ctx.actionName &&
        router.config.defaultAction.length > 1 &&
        router.config.defaultAction[1] !== undefined
    ) {
        ctx.tracer.logStep(
            `No cache exists and found default action data for the same action. Binding this data to the context`
        );

        const pathData = {
            [router.name]: router.config.defaultAction[1],
            ...options.pathData
        };

        return {location: {...location}, ctx: {...ctx, pathData}};
    }
    return {location, ctx};
};

export default bindDefaultActionDataToContext;
