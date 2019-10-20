/**
 * The root router has no state and by default is always visible
 * 
 */
import { RouterAction, RouterReducer, IRouterCurrentState, IRouterTemplate } from "../../types";

const show: RouterAction = (_options, location, _router, _ctx) => {
  return location;
};

const hide: RouterAction = (_options, location, _router, _ctx) => {
  return { search: {}, pathname: [], options: location.options };
};

const reducer: RouterReducer = (location, _router, _ctx) => {
  const hasSearchRouters = Object.keys(location.search).length > 0;
  const hasPathRouters = location.pathname.length > 0;

  return { visible: hasSearchRouters || hasPathRouters };
};


const template: IRouterTemplate = {
  actions: { show, hide },
  reducer,
  config: { canBePathRouter: true }
};
export default template;

