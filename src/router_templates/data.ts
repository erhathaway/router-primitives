import {TemplateAction, TemplateReducer, IRouterTemplate} from '../types';

/**
 * A data router will display data as the routeKey in either the pathname or query params
 *   depending on if the router is a `pathRouter` or not.
 * Furthermore, a data router will only be shown if data exits.
 * This process involves:
 *    1. Checking for data either passed in directly (via options) or existing
 *       on the router state
 *    2. Checking if the router is a path router or not
 *    3. Adding the scene router to either the path or query params
 */
const show: TemplateAction<CustomState, CustomActionNames> = (
    _options,
    oldLocation,
    router,
    ctx
) => {
    const location = {...oldLocation};

    const data = (ctx && ctx.pathData && ctx.pathData[router.name]
        ? ctx.pathData[router.name]
        : router.data) as CustomState;

    if (!data) {
        throw new Error(`Can't show data router ${router.name} b/c the data field is not set`);
    }

    if (router.isPathRouter) {
        location.pathname[router.pathLocation] = data;
        // drop pathname after this pathLocation
        location.pathname = location.pathname.slice(0, router.pathLocation + 1);
    } else {
        location.search[router.routeKey] = data;
    }
    return location;
};

const hide: TemplateAction<CustomState, CustomActionNames> = (
    _options,
    oldLocation,
    router,
    _ctx
) => {
    const location = {...oldLocation};

    if (router.isPathRouter) {
        location.pathname = location.pathname.slice(0, router.pathLocation);
    } else {
        location.search[router.routeKey] = undefined;
    }

    return location;
};

const setData: TemplateAction<CustomState, CustomActionNames> = (
    options,
    location,
    router,
    ctx
) => {
    return router.show(options, location, router, ctx);
};

const reducer: TemplateReducer<string, 'setData'> = (location, router, _ctx) => {
    // TODO change this to ValueOf<IInputSearch> when data supports more than just `string` types
    let routerData: string;
    if (router.isPathRouter) {
        routerData = location.pathname[router.pathLocation];
    } else {
        routerData = location.search[router.routeKey] as string;
    }

    return {
        visible: !!routerData,
        data: routerData || router.state.data
    };
};

type CustomState = string;
type CustomActionNames = 'setData';
const template: IRouterTemplate<CustomState, CustomActionNames> = {
    actions: {show, hide, setData},
    reducer,
    config: {canBePathRouter: true, isPathRouter: false, isDependentOnExternalData: true}
};
export default template;
