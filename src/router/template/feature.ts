import { RouterAction, RouterReducer, IRouterCurrentState } from "../../types";

const show: RouterAction = (options, location, router, ctx = {}) => {
  location.search[router.routeKey] = true;

  return location;
};

const hide: RouterAction = (options, location, router, ctx) => {
  location.search[router.routeKey] = undefined;

  return location;
};

const reducer: RouterReducer = (location, router, ctx) => {
  const newState: IRouterCurrentState = {};
  newState['visible'] = location.search[router.routeKey] === 'true';
  
  return newState;
};


export default {
  actions: { show, hide },
  reducer,
};
