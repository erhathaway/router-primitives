import {ActionStep} from '../types';

const stopRouterCacheTransaction: ActionStep = (options, location, router, ctx) => {
    if (options.dryRun) {
        router.manager.routerCache.discardTransaction();
    } else {
        router.manager.routerCache.saveTransaction();
    }

    return {location, ctx};
};

export default stopRouterCacheTransaction;
