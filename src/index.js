import { observable } from "mobx"

// import queryString from 'query-string';

import {
  // dynamicallyGenerateNavToPathMethods,
  // dynamicallyGenerateToggleModalMethods,
  // dynamicallyGenerateToggleVisibleFeaturesMethods,
  // dynamicallyGeneratePageNavMethods,
  extractScene,
  // extractFeatures,
  extractModal,
  // extractPage,
} from './utils';

const routeKeys = [];

const randomKey = (keySize = 1) => {
  const N = keySize;
  return Array(N+1).join((Math.random().toString(36)+'00000000000000000').slice(2, 18)).slice(0, N)
}

const createUniqueKey = (keySize = 1) => {
  let key;
  const duplicateKey = () => routeKeys.includes(key) && key

  while (!key || duplicateKey()) {
    key = randomKey(keySize)
  }
  routeKeys.push(key)
  return key;
}

class Router {
  @observable visible = undefined;
  @observable order = undefined;
  @observable history = { at: undefined, from: undefined };

  _routers = {};

  _hooks = {
    before: [],
    after: []
  };

  constructor(config = {routeKey: undefined }) {
    const { name, routeKey, routers, hooks, visible, order } = config;
    console.log('routers', routers)
    if (routers) this.routers = routers;
    if (hooks) this.hooks = hooks;

    this.visible = visible || false;
    this.order = order;
    this.name = name;
    this.routeKey = routeKey || createUniqueKey();
  }

  set routers(routers = {}) {
    this._routers = { ...this.routers, ...routers };
  }

  get routers() { return this._routers; }

  set hooks(hooks = {}) {
    this._hooks = { ...this.hooks, ...hooks };
  }

  get hooks() { return this._hooks; }

  _update(newLocation) {
    console.log('updating stuff', newLocation)
    // hook(location, context)
    let location = newLocation;
    let context = { visible: this.visible, order: this.order, history: this.history};
    // console.log('ctx', context)
    this.hooks.before.forEach(hook => hook(location, context));

    const routerKeys = Object.keys(this.routers);
    routerKeys.forEach(key => {
      // call child routers type update function
      this[key](location, context);

      // pass new location to child routers
      const routers = this.routers[key];
      if (Array.isArray(routers)) {
        routers.forEach(r => { if (r && r._update) r._update(location) });
      } else {
        if (routers._update) routers._update(location);
      }
    })

    this.hooks.after.forEach(hook => hook(location, context));
  }

  _setState({ visible, at, order }) {
    if (at) {
      this.history.from = this.history.at;
      this.history.at = at;
    }
    if (order) this.order = order;
    if (visible) this.visible = visible;
  }

  stack(newLocation, context) {
    const stackOrder = extractModal(newLocation, this.routeKey);
    const visibleRouteKeys = Object.keys(stackOrder);

    this.routers.stack.forEach(r => {
      if (!r) return;

      const atSamePlace = r.at === stackOrder;
      const hasSameVisibility = r.visible === visibleRouteKeys.includes(r.routeKey);
      const hasSameOrder = r.order === stackOrder[r.routeKey];

      if (r._setState && !atSamePlace && !hasSameVisibility && !hasSameOrder) {
        r._setState({
          visible: visibleRouteKeys.includes(r.routeKey),
          order: stackOrder[r.routeKey],
          at: stackOrder,
        });
      }
    })

    console.log('visibleRouteKeyskkk', visibleRouteKeys)
  }

  switch(newLocation, context) {
    const visibleRouteKey = extractScene(newLocation, this.routeKey);

    this.routers.switch.forEach(r => {
      if (!r) return;

      if (r._setState && r.at !== visibleRouteKey && r.visible !== r.routeKey === visibleRouteKey) {
        r._setState({
          visible: r.routeKey === visibleRouteKey,
          at: visibleRouteKey,
        });
      }
    });

    console.log('switch', visibleRouteKey)
  }

  feature(newLocation, context) {

  }

  page(newLocation, context) {

  }
}


let existingLocation = undefined;
const registerRouter = (router) => {
  router.visible = true;
  console.log('registering router')

  window.setInterval(() => {
    if (existingLocation !== window.location.href) {
      existingLocation = window.location.href;
      const { pathname, search } = window.location;
      router._update({ pathname, search });
    }
  }, 100)
}

export { Router as default, registerRouter }
