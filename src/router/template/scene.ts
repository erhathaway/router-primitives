import {RouterActionFn, RouterReducerFn, RouterCurrentState, IRouterTemplate} from '../../types';

/**
 * A scene router will hide all its sibling routers when it is being shown
 * This process involves:
 *    1. Hiding the sibling routers and disabling cache for the specific router so it doesn't rehydrate
 *    2. Checking whether the scene router is a pathRouter or not
 *    3. Adding the scene router to either the path or query params
 */
const show: RouterActionFn = (options, oldLocation, router, ctx) => {
    let location = {...oldLocation};
    // Each sibling router needs to be hidden. The location is modified to reflect hiding all siblings
    location = router.siblings.reduce((acc, s) => {
        // We disable caching of siblings b/c we dont want them to be shown if a parent rehydrates
        // This is b/c the scene being shown is now the visible one and should be cached if a parent hides
        // It is important to remember that `disableCaching` is passed to options not context
        //   b/c we only want it take affect for the immediate routers we call instead of the
        //   entire update cycle
        return s.hide({...options, disableCaching: true}, acc, s, ctx);
    }, location);

    if (router.isPathRouter) {
        // const {parent} = router;

        // If we are not adding defaults or the parent is not visible, use the existing location
        // This can happen when a router is called randomly. We don't want a router to become visible if it's
        //   parent isn't visible.
        // TODO check why this was added
        // currently disabled b/c it interferes with a scene calling parents that are not showing
        // if (!ctx.addingDefaults) { // } && (!parent || (!parent.state.visible && !parent.isRootRouter))) {
        //     return location;
        // }

        location.pathname[router.pathLocation] = router.routeKey;
        // Drop pathname after this pathLocation
        location.pathname = location.pathname.slice(0, router.pathLocation + 1);
    } else {
        location.search[router.routeKey] = true;
    }

    return location;
};

const hide: RouterActionFn = (_options, oldLocation, router, _ctx) => {
    const location = {...oldLocation};

    if (router.isPathRouter) {
        location.pathname = location.pathname.slice(0, router.pathLocation);
    } else {
        location.search[router.routeKey] = undefined;
    }

    return location;
};

const reducer: RouterReducerFn<{blueWorld: boolean}> = (location, router, _ctx) => {
    const newState: RouterCurrentState = {};
    if (router.isPathRouter) {
        newState['visible'] = location.pathname[router.pathLocation] === router.routeKey;
    } else {
        newState['visible'] = location.search[router.routeKey] === 'true';
    }

    return newState;
};

const template: IRouterTemplate<{blueWorld: boolean}, 'testAction'> = {
    actions: {show, hide, testAction: show},
    reducer,
    config: {canBePathRouter: true, isPathRouter: true, shouldInverselyActivate: true}
};
export default template;
