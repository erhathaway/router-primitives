
const createRouter = (routerInfo, existingRouters, RouterClass) => {
  const childRouterInfo = routerInfo.routers;
  const params = routerInfo;
  delete routerInfo.routers;

  const parentRouter = new RouterClass(params);
  existingRouters[routerInfo.name] = parentRouter;

  return { parentRouter, childRouterInfo };
}

const addChildRoutersToParentRouter = (childRouterInfo, parentRouter, existingRouters, RouterClass) => {
  const routerTypes = Object.keys(childRouterInfo || {});

  routerTypes.forEach((type) => {
    const routersByType = childRouterInfo[type];
    const producedRouters = routersByType.map((r) => {
      const { parentRouter: newParentRouter, childRouterInfo: newChildRouterInfo } = createRouter(r, existingRouters, RouterClass);
      addChildRoutersToParentRouter(newChildRouterInfo, newParentRouter, existingRouters, RouterClass);
      return newParentRouter;
    });
    parentRouter.routers = { [type]: producedRouters }
  });
};

const initalizeRouter = RouterClass => (routerInfo) => {
  const existingRouters = {};

  const { parentRouter, childRouterInfo } = createRouter({ ...routerInfo, name: 'root' }, existingRouters, RouterClass);
  addChildRoutersToParentRouter(childRouterInfo, parentRouter, existingRouters, RouterClass);

  return existingRouters;
};

export default initalizeRouter;
