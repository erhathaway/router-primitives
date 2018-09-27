import { observable } from "mobx"

import {
  extractScene,
  extractFeature,
  extractStack,
  extractPage,
} from './extractFromQueryString';

import {
  updateRouterTypeObject,
} from './setQueryString';

import registerRouter from './registerRouter';
import buildInitalizeRouterFn from './initalizeRouter';

const routeKeys = [];

// const randomKey = (keySize = 1) => {
//   const N = keySize;
//   return Array(N+1).join((Math.random().toString(36)+'00000000000000000').slice(2, 18)).slice(0, N)
// }
//
// const createUniqueKey = (keySize = 1) => {
//   let key;
//   const duplicateKey = () => routeKeys.includes(key) && key
//
//   while (!key || duplicateKey()) {
//     key = randomKey(keySize)
//   }
//   routeKeys.push(key)
//   return key;
// }

class Router {
  @observable visible = undefined;
  @observable order = undefined;
  @observable history = { at: undefined, from: undefined };

  _routers = {};

  _hooks = {
    before: [],
    after: []
  };

  _parent = undefined;
  _type = undefined;

  static searchString() {
    return window.location.search || '';
  }

  static pathnameString() {
    return window.location.pathname || '';
  }

  static location() {
    return { pathname: Router.pathnameString(), search: Router.searchString() }
  }

  constructor(config = { routeKey: undefined }) {
    const { name, routeKey, routers, hooks, visible, order } = config;
    // console.log('routers', routers)

    this.visible = visible || false;
    this.order = order;
    this.name = name;
    this.routeKey = routeKey || this.name; //createUniqueKey();
    if (hooks) this.hooks = hooks;
    if (routers) this.routers = routers;

    this.show = this.show.bind(this);
    this.hide = this.hide.bind(this);
  }

  set parent(parentRouter) {
    this._parent = parentRouter;
  }

  get parent() { return this._parent };

  set type(routerType) {
    this._type = routerType;
  }

  get type() { return this._type };

  set routers(routers = {}) {
    this._routers = { ...this.routers, ...routers };

    const routerTypes = Object.keys(this.routers);
    routerTypes.forEach(type => {
      this.routers[type].forEach(r => {
        // console.log('r', r, type, this.routers, this.name)
        r.parent = this;
        r.type = type;
      });
    })
  }

  get routers() { return this._routers; }

  set hooks(hooks = {}) {
    this._hooks = { ...this.hooks, ...hooks };
  }

  get hooks() { return this._hooks; }

  show() {
    this.visible = true;
    const location = Router.location();

    const data = {};
    if (this.parent) {
      this.parent.routers[this.type].forEach(r => data[r.routeKey] = undefined);
    }

    data[this.routeKey] = true;

    updateRouterTypeObject(this.type, data, location)
  }

  hide() {
    this.visible = false;
    const location = Router.location();

    const data = {};
    if (this.parent) {
      this.parent.routers[this.type].forEach(r => data[r.routeKey] = undefined);
    }

    updateRouterTypeObject(this.type, data, location)
  }

  _update(newLocation) {
    // console.log('running #_update', newLocation, this.name)
    // hook(location, context)
    let location = newLocation;
    let context = { visible: this.visible, order: this.order, history: this.history};
    // console.log('ctx', context)
    this.hooks.before.forEach(hook => hook(location, context));

    const routerKeys = Object.keys(this.routers);
    routerKeys.forEach(key => {
      // reduce state for each child router type
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
    // console.log('running stack', this.name)

    const stackOrder = extractStack(newLocation, this.routeKey) || {};
    const visibleRouteKeys = Object.keys(stackOrder);

    this.routers.stack.forEach(r => {
      if (!r) return;
      // console.log('stack', this.name, r.name, stackOrder)

      const atSamePlace = r.at === stackOrder;
      const hasSameVisibility = r.visible === visibleRouteKeys.includes(r.routeKey);
      const hasSameOrder = r.order === stackOrder[r.routeKey];

      if (r._setState && !atSamePlace && !hasSameVisibility && !hasSameOrder) {
        r._setState({
          visible: visibleRouteKeys.includes(r.routeKey),
          order: stackOrder[r.routeKey],
          at: stackOrder,
        });
        // console.log('stack triggered', r.name, r.visible, r.order)

      }
    })
  }

  scene(newLocation, context) {
    // console.log('running scene', this.name);
    const visibleRouteKey = extractScene(newLocation, this.routeKey);

    this.routers.scene.forEach(r => {
      if (!r) return;

      // console.log('scene', this.name, r.name, visibleRouteKey)

      if (r._setState && r.at !== visibleRouteKey && r.visible !== r.routeKey === visibleRouteKey) {
        r._setState({
          visible: r.routeKey === visibleRouteKey,
          at: visibleRouteKey,
        });
        // console.log('scene triggered', r.name, r.visible)
      }
    });

  }

  feature(newLocation, context) {
    // console.log('running feature', this.name)

    const visibleFeatures = extractFeature(newLocation, this.routeKey) || {};
    const visibleFeatureRouteKeyNames = Object.keys(visibleFeatures);

    this.routers.feature.forEach(r => {
      if (!r) return;

      // console.log('feature', this.name, r.name, visibleFeatures)

      const featureVisible = visibleFeatureRouteKeyNames.includes(r.routeKey)

      const atSamePlace = r.at === visibleFeatures;
      const hasSameVisibility = r.visible === featureVisible;

      if (r._setState && !atSamePlace && !hasSameVisibility) {
        r._setState({
          visible: featureVisible,
          at: visibleFeatures,
        });
        // console.log('feature triggered', r.name, r.visible)
      }
    })

  }

  page(newLocation, context) {

  }
}



const initalizeRouter = buildInitalizeRouterFn(Router);
// console.log('initalizeRouter', initalizeRouter)
export { Router as default, initalizeRouter, registerRouter }
