import { RouterAction, RouterReducer, IRouterState, IRouterCurrentState } from "../../types";

const show: RouterAction = (options, location, router, ctx = {}) => {
  const data = options.data || router.state.data;
  if (router.isPathRouter) {
    const { parent } = router;

    // TODO document why this is necessary
    if (!ctx.addingDefaults && (!parent || (!parent.state.visible && !parent.isRootRouter))) { return location; }

    location.pathname[router.pathLocation] = data;
    // drop pathname after this pathLocation
    location.pathname = location.pathname.slice(0, router.pathLocation + 1);
  } else {
    location.search[router.routeKey] = data;
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

const setData: RouterAction = (options, location, router, ctx = {}) => {
  return router.show(options);
};


const reducer: RouterReducer = (location, router, ctx) => {
  const newState: IRouterCurrentState = {};

  let routerData: string;
  if (router.isPathRouter) {
    routerData = location.pathname[router.pathLocation];
  } else {
    routerData = location.search[router.routeKey];
  }

  if (routerData) {
    newState['visible'] = true;
  }

  newState['data'] = routerData || router.state.data;

  return newState;
};

export default {
  actions: { show, hide, setData },
  reducer,
};
