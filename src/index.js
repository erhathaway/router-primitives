import { observable } from "mobx"

class Router {
  @observable isShowing;

  constructor(name, routeKey) {
    this.name = name;
    this.routeKey = routeKey;
  }

  setChildRouters(routers = {}) {
    const routerTypes = Object.keys(routers);
    routerTypes.forEach(typeName => {
      this[typeName] = routers[typeName];
    })
  }

  // addStackRouters()
  //
  // addFeatureRouters()
  //
  // addSceneRouters()
}


class StackRouter extends Router {

}

export default Router
