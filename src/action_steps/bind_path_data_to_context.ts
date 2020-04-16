import {ActionStep} from '../types';

const bindPathDataToContext: ActionStep = (options, location, router, ctx) => {
    if ((options.pathData && options.pathData[router.name]) || options.data) {
        const pathData = {
            [router.name]: options.data,
            ...options.pathData
        };

        ctx.tracer.logStep(`Binding pathData to the context`);

        return {location: {...location}, ctx: {...ctx, pathData}};
    } else if (
        (router.manager.routerCache.cache[router.name] === undefined ||
            (router.manager.routerCache.cache[router.name] &&
                router.manager.routerCache.cache[router.name].data === undefined)) &&
        router.config.defaultAction &&
        router.config.defaultAction[0] === ctx.actionName &&
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

export default bindPathDataToContext;
