import { observable } from "mobx"

import {
  extractScene,
  extractFeature,
  extractStack,
  extractPage,
  extractObject,
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

  static capitalize(string = '') {
    return string.charAt(0).toUpperCase() + string.slice(1)
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


  updateLocationViaMethod(location, methodNamePrefix) {
    const methodName = `${methodNamePrefix}${Router.capitalize(this.type)}`;
    if (methodName === methodNamePrefix) {
      throw `router type attribute is undefined for router with name: ${this.name}`;
    }

    try {
      const newRouterTypeObject = this[methodName](location);

      updateRouterTypeObject(this.type, newRouterTypeObject, location);
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
    this.visible = true;

    const METHOD_NAME_PREFIX = 'show';
    const location = Router.location();
    this.updateLocationViaMethod(location, METHOD_NAME_PREFIX);
  }

  // all routers implement this method
  hide() {
    this.visible = false;

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
    console.log('here', this)

    this.updateLocationViaMethod(location, METHOD_NAME_PREFIX);
  }

  /* SCENE SPECIFIC */
  showScene() {
    const data = {};
    if (this.parent) {
      this.parent.routers[this.type].forEach(r => data[r.routeKey] = undefined);
    }

    data[this.routeKey] = true;
    return data;
  }

  hideScene() {
    const data = {};
    if (this.parent) {
      this.parent.routers[this.type].forEach(r => data[r.routeKey] = undefined);
    }
    return data;
  }

  /* STACK SPECIFIC */
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
    console.log('showing stack', location)
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
    return sortedKeys.reduce((acc, key, i) => {
      acc[key] = i + 1;
      return acc;
    }, {})
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
    const data = sortedKeys.reduce((acc, key, i) => {
      acc[key] = i + 1;
      return acc;
    }, {})
    // remove this routeKey from the router type data
    data[this.routeKey] = undefined;
    return data;
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
    const data = sortedKeys.reduce((acc, key, i) => {
      acc[key] = i + 1;
      return acc;
    }, {})

    return data;
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
    return sortedKeys.reduce((acc, key, i) => {
      acc[key] = i + 1;
      return acc;
    }, {})
  }

  bringToFrontStack(location) {
    return this.showStack(location)
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
    return sortedKeys.reduce((acc, key, i) => {
      acc[key] = i + 1;
      return acc;
    }, {})
  }

  /* FEATURE SPECIFIC */
  showFeature() {
    return { [this.routeKey]: true };
  }

  hideFeature() {
    return { [this.routeKey]: undefined };
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
    console.log('running stack', this.name)

    // const stackOrder = extractStack(newLocation, this.routeKey) || {};
    // const visibleRouteKeys = Object.keys(stackOrder);

    // this.routers.stack.forEach(r => {
    //   if (!r) return;
    //   // console.log('stack', this.name, r.name, stackOrder)
    //
    //   const atSamePlace = r.at === stackOrder;
    //   const hasSameVisibility = r.visible === visibleRouteKeys.includes(r.routeKey);
    //   const hasSameOrder = r.order === stackOrder[r.routeKey];
    //
    //   if (r._setState && !atSamePlace && !hasSameVisibility && !hasSameOrder) {
    //     r._setState({
    //       visible: visibleRouteKeys.includes(r.routeKey),
    //       order: stackOrder[r.routeKey],
    //       at: stackOrder,
    //     });
    //     // console.log('stack triggered', r.name, r.visible, r.order)
    //
    //   }
    // })
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

    // const visibleFeatures = extractFeature(newLocation, this.routeKey) || {};
    // const visibleFeatureRouteKeyNames = Object.keys(visibleFeatures);
    //
    // this.routers.feature.forEach(r => {
    //   if (!r) return;
    //
    //   // console.log('feature', this.name, r.name, visibleFeatures)
    //
    //   const featureVisible = visibleFeatureRouteKeyNames.includes(r.routeKey)
    //
    //   const atSamePlace = r.at === visibleFeatures;
    //   const hasSameVisibility = r.visible === featureVisible;
    //
    //   if (r._setState && !atSamePlace && !hasSameVisibility) {
    //     r._setState({
    //       visible: featureVisible,
    //       at: visibleFeatures,
    //     });
    //     // console.log('feature triggered', r.name, r.visible)
    //   }
    // })

  }

  page(newLocation, context) {

  }
}



const initalizeRouter = buildInitalizeRouterFn(Router);
// console.log('initalizeRouter', initalizeRouter)
export { Router as default, initalizeRouter, registerRouter }
