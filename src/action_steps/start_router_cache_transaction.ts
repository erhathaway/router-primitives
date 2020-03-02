import {ActionStep} from '../types';

const startRouterCacheTransaction: ActionStep = (_options, location, router, ctx) => {
    router.manager.routerCache.startTransaction();

    return {location, ctx};
};

export default startRouterCacheTransaction;
