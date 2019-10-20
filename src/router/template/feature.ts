import {RouterAction, RouterReducer, IRouterCurrentState, IRouterTemplate} from '../../types';

/**
 * A feature router does not interact with its sibling routers. It lives harmony with them
 *   making no judgements about their state.
 */
const show: RouterAction = (_options, oldLocation, router, _ctx) => {
    const location = {...oldLocation};
    location.search[router.routeKey] = true;

    return location;
};

const hide: RouterAction = (options, oldLocation, router, _ctx) => {
    const location = {...oldLocation};
    location.search[router.routeKey] = undefined;

    return location;
};

const reducer: RouterReducer = (location, router, _ctx) => {
    const newState: IRouterCurrentState = {};
    newState['visible'] = location.search[router.routeKey] === 'true';

    return newState;
};

const template: IRouterTemplate = {
    actions: {show, hide},
    reducer,
    config: {canBePathRouter: false}
};
export default template;
