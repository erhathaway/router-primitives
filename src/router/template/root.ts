/**
 * The root router has no state and by default is always visible
 * 
 */
import { RouterAction, RouterReducer, IRouterCurrentState } from "../../types";

const show: RouterAction = (_options, location, _router, _ctx) => {
  return location;
};

const hide: RouterAction = (_options, location, _router, _ctx) => {
  return location;
};

const reducer: RouterReducer = (_location, _router, _ctx) => {
  return { visible: true };
};


export default {
  actions: { show, hide },
  reducer,
};
