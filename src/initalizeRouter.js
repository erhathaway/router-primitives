// @flow

import type {
  RouterInfoForCreation,
} from './types';

import type Router from './index';

type RouterClassType = (RouterInfoForCreation) => Router;
type ExistingRoutersType = { [string]: Router };

const createRouter = (routerInfo: RouterInfoForCreation, existingRouters: ExistingRoutersType, RouterClass: RouterClassType) => {
  const childRouterInfo = routerInfo.routers;
  const params = routerInfo;
  delete routerInfo.routers; // eslint-disable-line no-param-reassign

  const parentRouter = new RouterClass(params);
  existingRouters[routerInfo.name] = parentRouter; // eslint-disable-line no-param-reassign

  return { parentRouter, childRouterInfo };
};

const addChildRoutersToParentRouter = (childRouterInfo: ?RouterInfoForCreation, parentRouter: Router, existingRouters: ExistingRoutersType, RouterClass: RouterClassType) => { // eslint-disable-line max-len
  const routerTypes = Object.keys(childRouterInfo || {});

  routerTypes.forEach((type) => {
    const routersByType: Array<RouterInfoForCreation> = childRouterInfo[type];
    const producedRouters = routersByType.map((r) => {
      const { parentRouter: newParentRouter, childRouterInfo: newChildRouterInfo } = createRouter(r, existingRouters, RouterClass);
      addChildRoutersToParentRouter(newChildRouterInfo, newParentRouter, existingRouters, RouterClass);
      return newParentRouter;
    });
    parentRouter.routers = { [type]: producedRouters }; // eslint-disable-line no-param-reassign
  });
};

const initalizeRouter = (RouterClass: Function) => (routerInfo: RouterInfoForCreation) => {
  const existingRouters = {};

  const { parentRouter, childRouterInfo } = createRouter({ ...routerInfo, name: 'root' }, existingRouters, RouterClass);
  if (childRouterInfo) addChildRoutersToParentRouter(childRouterInfo, parentRouter, existingRouters, RouterClass);

  return existingRouters;
};

export default initalizeRouter;
