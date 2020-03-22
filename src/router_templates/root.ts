/**
 * The root router has no state and by default is always visible
 *
 */
import {RouterActionFn, RouterReducerFn, IRouterTemplate} from '../types';

const show: RouterActionFn = (_options, location, _router, _ctx) => {
    return location;
};

const hide: RouterActionFn = (_options, location, _router, _ctx) => {
    return location;
};

const reducer: RouterReducerFn = (location, _router, _ctx) => {
    const hasSearchRouters = Object.keys(location.search).length > 0;
    const hasPathRouters = location.pathname.length > 0;

    return {visible: hasSearchRouters || hasPathRouters};
};

const template: IRouterTemplate<{}, 'rootAction'> = {
    actions: {show, hide, rootAction: hide},
    reducer,
    config: {canBePathRouter: true, isPathRouter: true}
};
export default template;
