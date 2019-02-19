import { RouterAction, RouterReducer } from "../../types";

const show: RouterAction = (options, location, router, ctx = {}) => {
  // hide sibling routers
  location = router.siblings.reduce((acc, s) => { 
    return s.hide(options, acc, s, ctx);
  }, location);

  if (router.isPathRouter) {
    const { parent } = router;

    if (!ctx.addingDefaults && (!parent || (!parent.state.visible && !parent.isRootRouter))) { return location; }

    location.pathname[router.pathLocation] = router.routeKey;
    // drop pathname after this pathLocation
    location.pathname = location.pathname.slice(0, router.pathLocation + 1);
  } else {
    location.search[router.routeKey] = true;
  }

  // add defaults for child routers
  // location = router.constructor.addLocationDefaults(options, location, router, ctx);

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
  const newState: { [key: string]: any } = {};
  if (router.isPathRouter) {
    newState['visible'] = location.pathname[router.pathLocation] === router.routeKey;
  } else {
    newState['visible'] = location.search[router.routeKey] === 'true';
  }

  return newState;
};


const scene = {
  actions: { show, hide },
  reducer,
};

export default scene;