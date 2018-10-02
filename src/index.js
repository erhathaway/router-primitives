import { observable } from "mobx"

import {
  extractScene,
  extractFeature,
  extractStack,
  extractPage,
  extractObject,
} from './extractFromQueryString';

import {
  updateLocationByRouterType,
} from './setLocation';

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
  @observable state = {};

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

  static capitalize(string = '') {
    return string.charAt(0).toUpperCase() + string.slice(1)
  }

  constructor(config = { routeKey: undefined }) {
    const { name, routeKey, routers, hooks, visible, order } = config;

    this.visible = visible || false;
    this.order = order;
    this.name = name;
    this.routeKey = routeKey || this.name; //createUniqueKey();
    if (hooks) this.hooks = hooks;
    if (routers) this.routers = routers;

    this.show = this.show.bind(this);
    this.hide = this.hide.bind(this);
    this.bringToFront = this.bringToFront.bind(this);
    this.sendToBack = this.sendToBack.bind(this);
    this.moveForward = this.moveForward.bind(this);
    this.moveBackward = this.moveBackward.bind(this);
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

  get isPathRouter() {
    if (this.name === 'root') return true;
    return (this.type === 'scene' || this.type === 'page') && (this.parent.isPathRouter);
  }

  get routerLevel() {
    if (this.name === 'root') return 0;
    return 1 + this.parent.routerLevel;
  }


  updateLocationViaMethod(location, methodNamePrefix) {
    const methodName = `${methodNamePrefix}${Router.capitalize(this.type)}`;
    if (methodName === methodNamePrefix) {
      throw `router type attribute is undefined for router with name: ${this.name}`;
    }

    try {
      // an object with { pathname, search }
      // where pathname is a string
      // and search is an object of routeKeys belonging to a routerType and their value (usually boolean | int)
      console.log('this is the location', location)
      const newLocationForRouterType = this[methodName](location);

      updateLocationByRouterType(this.type, newLocationForRouterType, location);
    } catch (e) {
      if (e.message === 'this[methodName] is not a function') {
        throw `#show method is not implemented for router type: ${this.type}`;
      } else {
        throw e;
      }
    }
  }
  // all routers implement this method
  show() {
    const METHOD_NAME_PREFIX = 'show';
    const location = Router.location();
    this.updateLocationViaMethod(location, METHOD_NAME_PREFIX);
  }

  // all routers implement this method
  hide() {
    const METHOD_NAME_PREFIX = 'hide';
    const location = Router.location();
    this.updateLocationViaMethod(location, METHOD_NAME_PREFIX);
  }

  // only stack router implements this method
  moveForward() {
    const METHOD_NAME_PREFIX = 'moveForward';
    const location = Router.location();
    this.updateLocationViaMethod(location, METHOD_NAME_PREFIX);
  }

  // only stack router implements this method
  moveBackward() {
    const METHOD_NAME_PREFIX = 'moveBackward';
    const location = Router.location();
    this.updateLocationViaMethod(location, METHOD_NAME_PREFIX);
  }

  // only stack router implements this method
  bringToFront() {
    const METHOD_NAME_PREFIX = 'bringToFront';
    const location = Router.location();
    this.updateLocationViaMethod(location, METHOD_NAME_PREFIX);
  }

  // only stack router implements this method
  sendToBack() {
    const METHOD_NAME_PREFIX = 'sendToBack';
    const location = Router.location();
    this.updateLocationViaMethod(location, METHOD_NAME_PREFIX);
  }

  /* SCENE SPECIFIC */
  showScene(location) {
    const search = {};
    if (this.parent) {
      this.parent.routers[this.type].forEach(r => search[r.routeKey] = undefined);
    }

    if (this.isPathRouter) {
      // dont update pathname if parent isn't visible
      if (!this.parent.visible) return { search }

      const childScenes = this.routers['scene'];

      // if (childScenes && childScenes[0]) {
      //   const childHistory = childScenes[0].history.from || {};
      //   const keys = Object.keys(childHistory);
      //   const lastVisibleChildScene = keys.find(k => childHistory[k] === true);
      //
      //   if (lastVisibleChildScene) {
      //     console.log('childrouters', childScenes)
      //     const router = childScenes.find(r => r.routeKey === lastVisibleChildScene)
      //     console.log('found router', router)
      //     // if (router) setTimeout( () => router.show(), 1000);
      //   }
      //   console.log('last visible child scene', lastVisibleChildScene)
      // }
      const pathNameArr = location.pathname.split('/');
      pathNameArr[this.routerLevel] = this.routeKey;
      const pathname = pathNameArr.join('/');

      return { pathname, search }
    } else {
      search[this.routeKey] = true;
      return { search };
    }
  }

  hideScene(location) {
    const search = {};
    if (this.parent) {
      this.parent.routers[this.type].forEach(r => search[r.routeKey] = undefined);
    }

    if (this.isPathRouter) {
      const pathNameArr = location.pathname.split('/');

      const newArr = pathNameArr.slice(0, this.routerLevel);

      const tempPathname = newArr.join('/');
      const pathname = tempPathname === '' ? '/' : tempPathname;

      return { pathname, search }
    } else {
      return { search };
    }
  }

  /* STACK SPECIFIC */
  // takes an object of keys where the value's represent order and turns it into an array of ordered keys
  orderStackRouteKeys(routeKeyOrderObj) {
    /*
      { <routeKeyName>: <order> }
    */

    // reduce the order object to the array of sorted keys
    const routerRouteKeys = Object.keys(routeKeyOrderObj);
    /* reorder routeKeyOrderObj by order
      ex: { <order>: <routeKeyName> }
    */
    const orderAsKey = routerRouteKeys.reduce((acc, key) => {
      const value = routeKeyOrderObj[key]
      if (value != null && !isNaN(value)) {
        acc[routeKeyOrderObj[key]] = key;
      }
      return acc;
    }, {});

    const orders = Object.values(routeKeyOrderObj);
    const sortedOrders =  orders.sort((a, b) => a - b).filter(n => n != null && !isNaN(n));
    const sortedKeys = sortedOrders.map(order => orderAsKey[order]);
    return sortedKeys;
  }

  showStack(location) {
    // get routeKeys that belong to this router type
    const typeRouterRouteKeys = this.parent.routers[this.type].map(t => t.routeKey);
    // get current order for all routeKeys via the location state
    const routerTypeData = extractStack(location, typeRouterRouteKeys);
    const sortedKeys = this.orderStackRouteKeys(routerTypeData);


    // find index of this routers routeKey
    const index = sortedKeys.indexOf(this.routeKey);
    if (index > -1) {
      // remove routeKey if it exists
      sortedKeys.splice(index, 1);
    }
    // add route key to front of sorted keys
    sortedKeys.unshift(this.routeKey);

    // create router type data obj
    const search = sortedKeys.reduce((acc, key, i) => {
      acc[key] = i + 1;
      return acc;
    }, {})

    return { search };
  }

  hideStack(location) {
    // get routeKeys that belong to this router type
    const typeRouterRouteKeys = this.parent.routers[this.type].map(t => t.routeKey);
    // get current order for all routeKeys via the location state
    const routerTypeData = extractStack(location, typeRouterRouteKeys);
    const sortedKeys = this.orderStackRouteKeys(routerTypeData);

    // find index of this routers routeKey
    const index = sortedKeys.indexOf(this.routeKey);
    if (index > -1) {
      // remove routeKey if it exists
      sortedKeys.splice(index, 1);
    }

    // create router type data obj
    const search = sortedKeys.reduce((acc, key, i) => {
      acc[key] = i + 1;
      return acc;
    }, {})
    // remove this routeKey from the router type search
    search[this.routeKey] = undefined;
    return { search };
  }

  moveForwardStack(location) {
    // get routeKeys that belong to this router type
    const typeRouterRouteKeys = this.parent.routers[this.type].map(t => t.routeKey);
    // get current order for all routeKeys via the location state
    const routerTypeData = extractStack(location, typeRouterRouteKeys);
    const sortedKeys = this.orderStackRouteKeys(routerTypeData);


    // find index of this routers routeKey
    const index = sortedKeys.indexOf(this.routeKey);
    if (index > -1) {
      // remove routeKey if it exists
      sortedKeys.splice(index, 1);
    }

    // move routeKey router forward by one in the ordered routeKey list
    const newIndex = index >= 1 ? index - 1 : 0;
    sortedKeys.splice(newIndex, 0, this.routeKey);

    // create router type data obj
    const search = sortedKeys.reduce((acc, key, i) => {
      acc[key] = i + 1;
      return acc;
    }, {})

    return { search };
  }

  moveBackwardStack(location) {
    // get routeKeys that belong to this router type
    const typeRouterRouteKeys = this.parent.routers[this.type].map(t => t.routeKey);
    // get current order for all routeKeys via the location state
    const routerTypeData = extractStack(location, typeRouterRouteKeys);
    const sortedKeys = this.orderStackRouteKeys(routerTypeData);


    // find index of this routers routeKey
    const index = sortedKeys.indexOf(this.routeKey);
    if (index > -1) {
      // remove routeKey if it exists
      sortedKeys.splice(index, 1);
    }

    // move routeKey router backward by one in the ordered routeKey list
    const newIndex = index + 1;
    sortedKeys.splice(newIndex, 0, this.routeKey);

    // create router type data obj
    const search = sortedKeys.reduce((acc, key, i) => {
      acc[key] = i + 1;
      return acc;
    }, {});

    return { search };
  }

  bringToFrontStack(location) {
    return this.showStack(location);
  }

  sendToBackStack(location) {
    // get routeKeys that belong to this router type
    const typeRouterRouteKeys = this.parent.routers[this.type].map(t => t.routeKey);
    // get current order for all routeKeys via the location state
    const routerTypeData = extractStack(location, typeRouterRouteKeys);
    const sortedKeys = this.orderStackRouteKeys(routerTypeData);

    // find index of this routers routeKey
    const index = sortedKeys.indexOf(this.routeKey);
    if (index > -1) {
      // remove routeKey if it exists
      sortedKeys.splice(index, 1);
    }

    // add to back of stack
    sortedKeys.push(this.routeKey);

    // create router type data obj
    const search = sortedKeys.reduce((acc, key, i) => {
      acc[key] = i + 1;
      return acc;
    }, {});

    return { search };
  }

  /* FEATURE SPECIFIC */
  showFeature() {
    const search = { [this.routeKey]: true };
    return { search };
  }

  hideFeature() {
    const search = { [this.routeKey]: undefined };
    return { search };
  }

  _update(newLocation) {
    let location = newLocation;
    let context = { visible: this.visible, order: this.order, history: this.history};
    // this.hooks.before.forEach(hook => hook(location, context));

    const routerTypes = Object.keys(this.routers);
    routerTypes.forEach(type => {
      // pass new location to child routers
      const routers = this.routers[type];
      if (Array.isArray(routers)) {
        // add all routeKeys that belong to this router type
        const contextWithRouterKeys = { ...context, routeKeys: routers.map(t => t.routeKey) };
        routers.forEach(r => {
          try {
            // get new state for specific router
            const newRouterState = r[`update${Router.capitalize(type)}`](r.state, contextWithRouterKeys, location);
            r._setState(newRouterState);
            if (r && r._update) r._update();

          } catch (e) {
            if (e.message === '_this[("update" + Router.capitalize(...))] is not a function') {
              throw `Missing update function "update${Router.capitalize(type)}" for router type ${type}`;
            } else {
              throw e;
            }
          }
        });
      } else {
        throw 'Routers must be passed to a router type as an Array ex: { stack: [{ name: "Im a stack router" }, { name: "Stack2" }]}';
      }
    })

    this.hooks.after.forEach(hook => hook(location, context));
  }

  _setState(state = {}) {
    const { visible, at, order, ...otherState } = state;
    if (at) {
      this.history.from = this.history.at;
      this.history.at = at;
    }
    this.order = order ? order : undefined;
    this.visible = visible ? visible : false;

    this.state = state;
  }

  updateStack(parentState, parentContext, newLocation) {
    // console.log(this.name, this.isPathRouter, this.routerLevel, 'ispathrouter')

    const routerTypeData = extractStack(location, parentContext.routeKeys);
    const order = routerTypeData[this.routeKey];

    return {
      visible: order != null ? true : false,
      order,
      at: routerTypeData,
    }
  }

  updateScene(parentState, parentContext, newLocation) {
    // console.log(this.name, this.isPathRouter, this.routerLevel, 'ispathrouter')
    const routerTypeData = extractScene(location, parentContext.routeKeys, this.isPathRouter, this.routerLevel);
    const visible = routerTypeData[this.routeKey];

    return {
      visible,
      order: undefined,
      at: routerTypeData,
    }
  }

  updateFeature(parentState, parentContext, newLocation) {
    const routerTypeData = extractFeature(location, parentContext.routeKeys);
    const visible = routerTypeData[this.routeKey];
    return {
      visible,
      order: undefined,
      at: routerTypeData,
    }
  }

  updatePage(newLocation, context) {

  }
}



const initalizeRouter = buildInitalizeRouterFn(Router);
// console.log('initalizeRouter', initalizeRouter)
export { Router as default, initalizeRouter, registerRouter }
