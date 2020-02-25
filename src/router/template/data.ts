import { RouterActionFn, RouterReducerFn, RouterCurrentState, IRouterTemplate } from '../../types';

/**
 * A data router will display data as the routeKey in either the pathname or queryparams
 *   depending on if the router is a `pathRouter` or not.
 * Furthermore, a data router will only be shown if data exits.
 * This process involves:
 *    1. Checking for data either passed in directly (via options) or existing
 *       on the router state
 *    2. Checking if the router is a path router or not
 *    3. Adding the scene router to either the path or query params
 */
const show: RouterActionFn = (options, oldLocation, router, _ctx) => {
    const location = { ...oldLocation };

    const data = options && options.data ? options.data : router.state.data;
    if (!data) {
        return location;
    }
    if (router.isPathRouter) {
        // const {parent} = router;
        location.pathname[router.pathLocation] = data;
        // drop pathname after this pathLocation
        location.pathname = location.pathname.slice(0, router.pathLocation + 1);
    } else {
        location.search[router.routeKey] = data;
    }
    return location;
};

const hide: RouterActionFn = (_options, oldLocation, router, _ctx) => {
    const location = { ...oldLocation };

    if (router.isPathRouter) {
        location.pathname = location.pathname.slice(0, router.pathLocation);
    } else {
        location.search[router.routeKey] = undefined;
    }

    return location;
};

const setData: RouterActionFn = (options, location, router, ctx) => {
    return router.show(options, location, router, ctx);
};

const reducer: RouterReducerFn<{ data?: string }> = (location, router, _ctx) => {
    const newState: RouterCurrentState = {};

    let routerData: string;
    if (router.isPathRouter) {
        routerData = location.pathname[router.pathLocation];
    } else {
        routerData = location.search[router.routeKey];
    }

    if (routerData) {
        newState['visible'] = true;
    }

    newState['data'] = routerData || router.state.data;

    return newState;
};

const template: IRouterTemplate<{ data?: string }, 'setData'> = {
    actions: { show, hide, setData },
    reducer,
    config: { canBePathRouter: true, isPathRouter: false }
};
export default template;
