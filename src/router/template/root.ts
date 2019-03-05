/**
 * The root template is used to construct the root router
 * 
 * By default, it does not change the location when location actions are triggered,
 * and it is always visible.
 */
import { RouterAction, RouterReducer, IRouterCurrentState } from "../../types";

const show: RouterAction = (options, location, router, ctx = {}) => {
  return location;
};

const hide: RouterAction = (options, location, router, ctx) => {
  return location;
};

const reducer: RouterReducer = (location, router, ctx) => {
  return { visible: true };
};


export default {
  actions: { show, hide },
  reducer,
};
