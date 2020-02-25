import { RouterActionFn, RouterReducerFn, RouterCurrentState, IRouterTemplate } from '../../types';

/**
 * A feature router does not interact with its sibling routers. It lives harmony with them
 *   making no judgements about their state.
 */
const show: RouterActionFn = (_options, oldLocation, router, _ctx) => {
    const location = { ...oldLocation };
    location.search[router.routeKey] = true;

    return location;
};

const hide: RouterActionFn = (_options, oldLocation, router, _ctx) => {
    const location = { ...oldLocation };
    location.search[router.routeKey] = undefined;

    return location;
};

const reducer: RouterReducerFn = (location, router, _ctx) => {
    const newState: RouterCurrentState = {};
    newState['visible'] = location.search[router.routeKey] === 'true';

    return newState;
};

const template: IRouterTemplate = {
    actions: { show, hide },
    reducer,
    config: { canBePathRouter: false, shouldInverselyActivate: false }
};
export default template;
