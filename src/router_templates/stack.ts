import {
    TemplateAction,
    IRouterTemplate,
    IInputLocation,
    RouterCurrentState,
    TemplateReducer,
    TemplateRouter
} from '../types';

// returns the routeKey names of visible routers based on the ordering of their 'order' state
const getRouteKeyOrderings = (
    router: TemplateRouter<CustomState, CustomActionNames>,
    location: IInputLocation
): string[] => {
    // creates an object of { [visible router routeKey]: order }
    const routeKeyOrderObj = router.parent.children[router.type].reduce((acc, r) => {
        // check to make sure the stack is in the location and a bulk action affecting multiple siblings
        // hasn't already removed it
        if (r.state.visible === false || location.search[r.routeKey] === undefined) {
            return acc;
        }
        // TODO use generics to handle state type
        acc[r.routeKey] = (r.state as RouterCurrentState<number>).data;
        return acc;
    }, {} as {[key: string]: number});

    /**
     * { <routeKeyName>: <order> }
     */

    // reduce the order object to the array of sorted keys
    const routerRouteKeys = Object.keys(routeKeyOrderObj);

    const orderAsKey = routerRouteKeys.reduce((acc, key) => {
        const value = routeKeyOrderObj[key];
        if (value != null && !Number.isNaN(value)) {
            acc[routeKeyOrderObj[key]] = key;
        }
        return acc;
    }, {} as {[key: string]: string});

    const orders = Object.values(routeKeyOrderObj);
    const filteredOrders = orders.filter(n => n != null && !Number.isNaN(n));
    const sortedOrders = filteredOrders.sort((a, b) => a - b);
    const sortedKeys = sortedOrders.map(order => orderAsKey[order]);
    return sortedKeys;
};

const show: TemplateAction<CustomState, CustomActionNames> = (_options, location, router, _ctx) => {
    if (!router.parent) {
        return location;
    }

    const sortedKeys = getRouteKeyOrderings(router, location);

    // find index of this routers routeKey
    const index = sortedKeys.indexOf(router.routeKey);
    if (index > -1) {
        // remove routeKey if it exists
        sortedKeys.splice(index, 1);
    }
    // add route key to front of sorted keys
    sortedKeys.unshift(router.routeKey);

    // create search object
    const search = sortedKeys.reduce((acc, key, i) => {
        acc[key] = i + 1;
        return acc;
    }, {} as {[key: string]: number});

    location.search = {...location.search, ...search};

    return location;
};

const hide: TemplateAction<CustomState, CustomActionNames> = (_options, location, router, _ctx) => {
    if (!router.parent) {
        return location;
    }

    const sortedKeys = getRouteKeyOrderings(router, location);

    // find index of this routers routeKey
    const index = sortedKeys.indexOf(router.routeKey);
    if (index > -1) {
        // remove routeKey if it exists
        sortedKeys.splice(index, 1);
    }

    // create router type data obj
    const search = sortedKeys.reduce((acc, key, i) => {
        acc[key] = i + 1;
        return acc;
    }, {} as {[key: string]: number});

    // remove this routeKey from the router type search
    const newLocation = {...location};

    newLocation.search = {...location.search, ...search};
    newLocation.search[router.routeKey] = undefined;

    return newLocation;
};

const forward: TemplateAction<CustomState, CustomActionNames> = (
    _options,
    location,
    router,
    _ctx
) => {
    if (!router.parent) {
        return location;
    }

    const sortedKeys = getRouteKeyOrderings(router, location);

    // find index of this routers routeKey
    const index = sortedKeys.indexOf(router.routeKey);
    if (index > -1) {
        // remove routeKey if it exists
        sortedKeys.splice(index, 1);
    }

    // move routeKey router forward by one in the ordered routeKey list
    const newIndex = index >= 1 ? index - 1 : 0;
    sortedKeys.splice(newIndex, 0, router.routeKey);

    // create router type data obj
    const search = sortedKeys.reduce((acc, key, i) => {
        acc[key] = i + 1;
        return acc;
    }, {} as {[key: string]: number});

    location.search = {...location.search, ...search};

    return location;
};

const backward: TemplateAction<CustomState, CustomActionNames> = (
    _options,
    location,
    router,
    _ctx
) => {
    if (!router.parent) {
        return location;
    }

    const sortedKeys = getRouteKeyOrderings(router, location);

    // find index of this routers routeKey
    const index = sortedKeys.indexOf(router.routeKey);
    if (index > -1) {
        // remove routeKey if it exists
        sortedKeys.splice(index, 1);
    }

    // move routeKey router backward by one in the ordered routeKey list
    const newIndex = index + 1;
    sortedKeys.splice(newIndex, 0, router.routeKey);

    // create router type data obj
    const search = sortedKeys.reduce((acc, key, i) => {
        acc[key] = i + 1;
        return acc;
    }, {} as {[key: string]: number});

    location.search = {...location.search, ...search};

    return location;
};

const toFront: TemplateAction<CustomState, CustomActionNames> = (
    options,
    location,
    router,
    ctx
) => {
    return router.show(options, location, router, ctx);
};

const toBack: TemplateAction<CustomState, CustomActionNames> = (
    _options,
    location,
    router,
    _ctx
) => {
    if (!router.parent) {
        return location;
    }

    const sortedKeys = getRouteKeyOrderings(router, location);

    // find index of this routers routeKey
    const index = sortedKeys.indexOf(router.routeKey);
    if (index > -1) {
        // remove routeKey if it exists
        sortedKeys.splice(index, 1);
    }

    // add to back of stack
    sortedKeys.push(router.routeKey);

    // create router type data obj
    const search = sortedKeys.reduce((acc, key, i) => {
        acc[key] = i + 1;
        return acc;
    }, {} as {[key: string]: number});

    location.search = {...location.search, ...search};

    return location;
};

const reducer: TemplateReducer<CustomState, CustomActionNames> = (location, router, _ctx) => {
    const value = location.search[router.routeKey] as number;

    if (value) {
        return {
            visible: true,
            data: +value
        };
    }

    return {
        visible: false,
        data: undefined
    };
};

type CustomState = number;
type CustomActionNames = 'forward' | 'backward' | 'toFront' | 'toBack';

const template: IRouterTemplate<CustomState, CustomActionNames> = {
    actions: {show, hide, forward, backward, toFront, toBack},
    reducer,
    config: {canBePathRouter: false}
};
export default template;
