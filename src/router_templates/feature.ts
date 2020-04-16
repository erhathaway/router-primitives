import {TemplateAction, RouterCurrentState, IRouterTemplate, TemplateReducer} from '../types';

/**
 * A feature router does not interact with its sibling routers. It lives harmony with them
 *   making no judgements about their state.
 */
const show: TemplateAction = (_options, oldLocation, router, _ctx) => {
    const location = {...oldLocation};
    location.search[router.routeKey] = true;

    return location;
};

const hide: TemplateAction = (_options, oldLocation, router, _ctx) => {
    const location = {...oldLocation};
    location.search[router.routeKey] = undefined;

    return location;
};

const reducer: TemplateReducer = (location, router, _ctx) => {
    const newState: Partial<RouterCurrentState> = {};
    newState['visible'] = location.search[router.routeKey] === 'true';

    return newState as RouterCurrentState;
};

// type CustomState = number;
// TemplateAction<CustomState, CustomActionNames>
// TemplateReducer<CustomState, CustomActionNames>
// type CustomActionNames = 'forward' | 'backward' | 'toFront' | 'toBack';

const template: IRouterTemplate = {
    actions: {show, hide},
    reducer,
    config: {canBePathRouter: false, shouldInverselyActivate: true}
};
export default template;
