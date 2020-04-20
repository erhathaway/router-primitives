/**
 * The root router has no state and by default is always visible
 *
 */
import {TemplateAction, IRouterTemplate, TemplateReducer} from '../types';

const show: TemplateAction = (_options, location, _router, _ctx) => {
    return location;
};

const hide: TemplateAction = (_options, location, _router, _ctx) => {
    return location;
};

const reducer: TemplateReducer = (location, _router, _ctx) => {
    const hasSearchRouters = Object.keys(location.search).length > 0;
    const hasPathRouters = location.pathname.length > 0;

    return {visible: hasSearchRouters || hasPathRouters};
};

const template: IRouterTemplate = {
    actions: {show, hide},
    reducer,
    config: {canBePathRouter: true, isPathRouter: true}
};
export default template;
