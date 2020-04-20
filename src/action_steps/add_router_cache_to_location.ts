import {ActionStep} from '../types';

const addRouterCacheToLocation: ActionStep = (options, location, router, ctx) => {
    if (options.addCacheToLocation || location.search[router.manager.cacheKey]) {
        ctx.tracer.logStep(`Adding serialized router cache to location`);
        const serializedCache = router.manager.routerCache.serializedCache;
        location.search[router.manager.cacheKey] = serializedCache;
    }

    return {location: {...location}, ctx};
};

export default addRouterCacheToLocation;
