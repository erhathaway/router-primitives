import { RouterAction, RouterReducer, IRouterCurrentState } from "../../types";

const show: RouterAction = (options, location, router, ctx = {}) => {
  // hide sibling routers
  location = router.siblings.reduce((acc, s) => { 
    // disable caching of siblings b/c we dont want them to be shown if a parent rehydrates
    // b/c the scene being shown is now the visible one and should be cached
    return s.hide(options, acc, s, {...ctx, disableCaching: true});
  }, location);

  if (router.isPathRouter) {
    const { parent } = router;

    // If we are not adding defaults or the parent is not visible, use the existing location
    // This can happen when a router is called randomly. We don't want a router to become visible if it's 
    //   parent isn't visible.
    if (!ctx.addingDefaults && (!parent || (!parent.state.visible && !parent.isRootRouter))) { return location; }

    location.pathname[router.pathLocation] = router.routeKey;
    // drop pathname after this pathLocation
    location.pathname = location.pathname.slice(0, router.pathLocation + 1);
  } else {
    location.search[router.routeKey] = true;
  }

  return location;
};

const hide: RouterAction = (options, location, router, ctx) => {
  if (router.isPathRouter) {
    location.pathname = location.pathname.slice(0, router.pathLocation);
  } else {
    location.search[router.routeKey] = undefined;
  }

  return location;
};

const reducer: RouterReducer = (location, router, ctx) => {
  const newState: IRouterCurrentState = {};
  if (router.isPathRouter) {
    newState['visible'] = location.pathname[router.pathLocation] === router.routeKey;
  } else {
    newState['visible'] = location.search[router.routeKey] === 'true';
  }

  return newState;
};


export default {
  actions: { show, hide },
  reducer,
};
