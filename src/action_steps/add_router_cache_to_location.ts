import {ActionStep} from '../types';

const addRouterCacheToLocation: ActionStep = (options, location, router, ctx) => {
    if (options.addCacheToLocation) {
        ctx.tracer.logStep(`Adding serialized router cache to location`);
        const serializedCache = router.manager.routerCache.serializedCache;
        location.search['__cache'] = serializedCache;
    }

    return {location: {...location}, ctx};
};

export default addRouterCacheToLocation;
