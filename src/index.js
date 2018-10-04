// @flow

import { observable } from 'mobx';

import {
  extractScene,
  extractFeature,
  extractStack,
  extractData,
} from './extractLocation';

import setLocation from './setLocation';
import registerRouter from './registerRouter';
import buildInitalizeRouterFn from './initalizeRouter';

import type {
  HookFn,
  RouterType,
  RouterHooks,
  Location,
  RouterState,
  RouterConfig
} from './types';

class Router {
  @observable visible = undefined;

  @observable order = undefined;

  @observable history = { at: undefined, from: undefined };

  @observable state = {};

  routeKey: string;

  name: string;

  data = undefined;

  _routers = {};

  _hooks: RouterHooks;

  _parent = undefined;

  _type: RouterType;

  _isPathRouter = undefined;

  // undefined so it can be explicitly set to true or false to override parent settings
  _rehydrateChildRoutersState = undefined;

  static searchString() {
    return window.location.search || '';
  }

  static pathnameString() {
    return window.location.pathname || '';
  }

  static routerLocation() {
    return { pathname: Router.pathnameString(), search: Router.searchString() };
  }

  static capitalize(string: string = '') {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  constructor(config: RouterConfig) {
    const {
      name,
      routeKey,
      routers,
      hooks,
      visible,
      order,
      isPathRouter,
      state,
      rehydrateChildRoutersState,
    } = config;

    this.visible = visible || false;
    this.order = order;
    this.name = name;
    this.routeKey = routeKey ? routeKey.trim() : this.name.trim();
    this._isPathRouter = isPathRouter;
    this._rehydrateChildRoutersState = rehydrateChildRoutersState;
    if (hooks) this.hooks = hooks;
    if (routers) this.routers = routers;

    if (state && typeof state === 'object') {
      this.state = state;
    } else if (state) {
      throw 'The initial state object passed to a router constructor must be an object';
    }

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

  get parent() { return this._parent; }

  set type(routerType: RouterType) {
    this._type = routerType;
  }

  get type() { return this._type; }

  set routers(routers = {}) {
    this._routers = { ...this.routers, ...routers };

    const routerTypes = Object.keys(this.routers);
    routerTypes.forEach((type) => {
      this.routers[type].forEach((r) => {
        r.parent = this;
        r.type = type;
      });
    });
  }

  get routers() { return this._routers; }

  set hooks(hooks: RouterHooks) {
    this._hooks = { ...this.hooks, ...hooks };
  }

  get hooks() { return this._hooks; }

  get isPathRouter() {
    if (this.name === 'root') return true;
    // if this router was explicitly set to be a path router
    if (this._isPathRouter && this.parent && this.parent.isPathRouter) { return true; }
    if (this._isPathRouter) {
      throw `${this.type} router: ${this.name} is explicitly set to modify the pathname
        but one of its parent routers doesnt have this permission.
        Make sure all parents have 'isPathRouter' attribute set to 'true' in the router config OR
        Make sure all parents are of router type 'scene' or 'data'.
        If the routers parents have siblings of both 'scene' and 'data' the 'scene' router will always be used for the pathname
      `;
    }

    if (this.type === 'scene' && this.parent && this.parent.isPathRouter) {
      // check to make sure sibling data routers arent explicitly set to modify the pathname
      const siblingRouters = Object.keys(this.parent.routers.data || {});
      const isSiblingRouterExplictlyAPathRouter = siblingRouters.reduce((acc, r) => {
        // check all data router siblings and
        // make sure none have been explicitly set to be a path router
        const childRouter = this.parent.routers.data[r];
        return acc || childRouter._isPathRouter === true;
      }, false);

      if (isSiblingRouterExplictlyAPathRouter === false) return true;
    } else if (this.type === 'data' && this.parent && this.parent.isPathRouter) {
      if (this._isPathRouter === false) return false;
      // check to make sure sibling scene routers aren't present
      const siblingRouters = Object.keys(this.parent.routers.scene || {});

      if (siblingRouters.length === 0) return true;
    }

    return false;
  }

  get routerLevel(): number {
    if (!this.parent) return 0;
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
      // and search is an object of routeKeys belonging to a routerType
      // and their value (usually boolean | int)
      const newLocation = this[methodName](location);
      return newLocation;
      // setLocation(newLocation, location);
    } catch (e) {
      if (e.message === 'this[methodName] is not a function') {
        throw `#${methodNamePrefix} method is not implemented for router type: ${this.type}`;
      } else {
        throw e;
      }
    }
  }

  // get hasHistory() {
  //   return true
  // }

  get hasDefault() {
    return true;
  }

  isDescendentOf(parentKey) {
    if (this.parent) {
      return this.routeKey === parentKey || this.parent.isDescendentOf(parentKey);
    }
    return this.routeKey === parentKey;
  }

  rollBackToMostRecentState(existingLocation) {
    if (!this.history || !this.history.from) return existingLocation;
    const historicalRouteValue = this.history.from[this.routeKey];
    // const pathname = { ...existingLocation.pathname, ...oldPathname };
    // const pathname = existingLocation.pathname;
    let pathname;
    let search;
    if (this.isPathRouter) {
      const splitPath = existingLocation.pathname.split('/');
      // const presentRouter = splitPath[this.routerLevel];
      if (this.type === 'data' && historicalRouteValue != null) {
        splitPath[this.routerLevel] = historicalRouteValue;
      } else if (historicalRouteValue) {
        splitPath[this.routerLevel] = this.routeKey;
      }
      pathname = splitPath.join('/');
      search = existingLocation.search;
    } else {
      pathname = existingLocation.pathname;
      search = { ...existingLocation.search, [this.routeKey]: historicalRouteValue };
    }

    // const search = { ...existingLocation.search, ...oldSearch };
    // if (this.name === 'oScene') console.log('rolling back', pathname, search, historicalRouteValue)
    return { pathname, search };
  }

  useDefault(location) {
    return location;
  }

  // repopulate tree state
  updateLocationFnShow(newLocation: Location, router, ctx) {
    if (router.routeKey === ctx.originRouteKey) { return router.show(false, newLocation); }
    if (router.isDescendentOf(ctx.originRouteKey)) {
      if ((router._rehydrateChildRoutersState !== false) && (router._rehydrateChildRoutersState || ctx.rehydrateChildRoutersState)) {
        return router.rollBackToMostRecentState(newLocation);
      } else if (router.hasDefault){
        return router.useDefault(newLocation);
      }
    }
    return newLocation;
  }

  updateLocationFnHide(location: Location, router, ctx) {
    const locationToUseOnChild = { pathname: location.pathname, search: ctx.originalLocation.search }
    const updatedLocation = router.hide(false, locationToUseOnChild);
    const existingSearch = typeof(location.search) === 'object' ? location.search : {}

    return { pathname: updatedLocation.pathname, search: { ...existingSearch, ...updatedLocation.search } }
  }

  // fold a fn over a node and all its child nodes
  reduceStateTree(location: Location, router, fn, ctx) {
      const newLocation = fn(location, router, ctx);
      const childRouterTypes = Object.keys(router.routers || {});

      return childRouterTypes.reduce((locationA, type) => {
        return router.routers[type].reduce((locationB, childRouter) => {
          const newCtx = { ...ctx, rehydrateChildRoutersState: childRouter.rehydrateChildRoutersState || ctx.rehydrateChildRoutersState }
          return this.reduceStateTree(locationB, childRouter, fn, newCtx);
        }, locationA);
      }, newLocation);
  }

  // all routers implement this method
  show(isOriginalCall: boolean = true, existingLocation: Location) {
    const METHOD_NAME_PREFIX = 'show';
    const location = existingLocation || Router.routerLocation();
    // const newLocation = this.updateLocationViaMethod(location, METHOD_NAME_PREFIX);
    if (isOriginalCall && !this.visible) {
      const ctx = {
        originRouteKey: this.routeKey,
        rehydrateChildRoutersState: this._rehydrateChildRoutersState,
      };
      // console.log('ctx', ctx)
      const newLocation = this.reduceStateTree(location, this, this.updateLocationFnShow, ctx);
      setLocation(newLocation, location);
    } else {
      const newLocation = this.updateLocationViaMethod(location, METHOD_NAME_PREFIX);
      return newLocation;
    }
  }

  // all routers implement this method
  hide(isOriginalCall: boolean = true, existingLocation: Location) {
    const METHOD_NAME_PREFIX = 'hide';
    const location = existingLocation || Router.routerLocation();
    // console.log(location, 'init hide')
    if (isOriginalCall && this.visible) {
      const ctx = {
        originRouteKey: this.routeKey,
        rehydrateChildRoutersState: this._rehydrateChildRoutersState,
        originalLocation: location,
      };
      // const location = Router.routerLocation();
      // this.updateLocationViaMethod(location, METHOD_NAME_PREFIX);
      const newLocation = this.reduceStateTree(location, this, this.updateLocationFnHide, ctx);
      // console.log('new location', newLocation)
      // const newLocation = this.updateLocationViaMethod(location, METHOD_NAME_PREFIX);
      setLocation(newLocation, location);
    } else {
      const newLocation = this.updateLocationViaMethod(location, METHOD_NAME_PREFIX);
      return newLocation;
    }
  }

  // only stack router implements this method
  moveForward() {
    const METHOD_NAME_PREFIX = 'moveForward';
    const location = Router.routerLocation();
    // this.updateLocationViaMethod(location, METHOD_NAME_PREFIX);
    const newLocation = this.updateLocationViaMethod(location, METHOD_NAME_PREFIX);
    setLocation(newLocation, location);
  }

  // only stack router implements this method
  moveBackward() {
    const METHOD_NAME_PREFIX = 'moveBackward';
    const location = Router.routerLocation();
    // this.updateLocationViaMethod(location, METHOD_NAME_PREFIX);
    const newLocation = this.updateLocationViaMethod(location, METHOD_NAME_PREFIX);
    setLocation(newLocation, location);
  }

  // only stack router implements this method
  bringToFront() {
    const METHOD_NAME_PREFIX = 'bringToFront';
    const location = Router.routerLocation();
    // this.updateLocationViaMethod(location, METHOD_NAME_PREFIX);
    const newLocation = this.updateLocationViaMethod(location, METHOD_NAME_PREFIX);
    setLocation(newLocation, location);
  }

  // only stack router implements this method
  sendToBack() {
    const METHOD_NAME_PREFIX = 'sendToBack';
    const location = Router.routerLocation();
    // this.updateLocationViaMethod(location, METHOD_NAME_PREFIX);
    const newLocation = this.updateLocationViaMethod(location, METHOD_NAME_PREFIX);
    setLocation(newLocation, location);
  }

  /* -------------------------------------
  ROUTER SPECIFIC METHODS FOR LOCATION UPDATING
  ----------------------------------------*/

  /* SCENE SPECIFIC */
  showScene(location: Location) {
    const search = {};
    if (this.parent) {
      this.parent.routers[this.type].forEach((r) => {
        search[r.routeKey] = undefined;
        // if (r.routeKey !== this.routeKey) r.hide(location);
      });
    }

    if (this.isPathRouter) {
      // dont update pathname if parent isn't visible
      if (this.parent && !this.parent.visible) return { search };

      const pathNameArr = location.pathname.split('/');
      pathNameArr[this.routerLevel] = this.routeKey;
      const pathname = pathNameArr.join('/');

      return { pathname, search };
    }
    search[this.routeKey] = true;
    return { search };
  }

  hideScene(location: Location) {
    const search = {};
    if (this.parent) {
      this.parent.routers[this.type].forEach((r) => { search[r.routeKey] = undefined; });
    }

    if (this.isPathRouter) {
      const pathNameArr = location.pathname.split('/');

      const newArr = pathNameArr.slice(0, this.routerLevel);

      const tempPathname = newArr.join('/');
      const pathname = tempPathname === '' ? '/' : tempPathname;

      return { pathname, search };
    }
    return { search };
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
      const value = routeKeyOrderObj[key];
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

  showStack(location: Location) {
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
    }, {});

    return { search };
  }

  hideStack(location: Location): Location {
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
    }, {});
    // remove this routeKey from the router type search
    search[this.routeKey] = undefined;
    return { search };
  }

  moveForwardStack(location: Location): Location {
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
    }, {});

    return { search };
  }

  moveBackwardStack(location: Location): Location {
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

  bringToFrontStack(location: Location): Location {
    return this.showStack(location);
  }

  sendToBackStack(location: Location): Location {
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

  /* FEATURE ROUTER SPECIFIC */
  showFeature() {
    const search = { [this.routeKey]: true };
    return { search };
  }

  hideFeature(location: Location) {
    const search = { [this.routeKey]: undefined };
    return { pathname: location.pathname, search };
  }

  /* DATA ROUTER SPECIFIC */
  showData(location: Location) {
    if (this.isPathRouter) {
      const search = {};
      // dont update pathname if parent isn't visible
      if (!this.parent.visible) return { search };

      const pathNameArr = location.pathname.split('/');
      pathNameArr[this.routerLevel] = this.state.data;
      const pathname = pathNameArr.join('/');

      return { pathname, search };
    }

    const search = { [this.routeKey]: this.state ? this.state.data : undefined };
    return { search };
  }

  hideData(location: Location) {
    const search = { [this.routeKey]: undefined };

    if (this.isPathRouter) {
      const pathNameArr = location.pathname.split('/');

      const newArr = pathNameArr.slice(0, this.routerLevel);

      const tempPathname = newArr.join('/');
      const pathname = tempPathname === '' ? '/' : tempPathname;

      // console.log('hiding data', this.name, pathname, search)
      return { pathname, search };
    }
    return { pathname: location.pathname, search };
  }

  setData(data: string) {
    this.state.data = data;
    this.show();
  }

  _update(newLocation: Location) {
    const location = newLocation;
    const context = { visible: this.visible, order: this.order, history: this.history };
    // this.hooks.before.forEach(hook => hook(location, context));

    const routerTypes = Object.keys(this.routers);
    routerTypes.forEach((type) => {
      // pass new location to child routers
      const routers = this.routers[type];
      if (Array.isArray(routers)) {
        // add all routeKeys that belong to this router type
        const contextWithRouterKeys = { ...context, routeKeys: routers.map(t => t.routeKey) };
        routers.forEach((r) => {
          try {
            // get new state for specific router
            const newRouterState = r[`update${Router.capitalize(type)}`](r.state, contextWithRouterKeys, location);
            if (newRouterState) r._setState(newRouterState);
            if (r && r._update) r._update(location);
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

    // this.hooks.after.forEach(hook => hook(location, context));
  }

  _setState(state: RouterState) {
    const {
      visible,
      at,
      order,
      data,
    } = state;

    if (at) {
      this.history.from = this.history.at;
      this.history.at = at;
    }
    this.order = order;
    this.visible = visible || false;
    this.data = data;

    this.state = { ...this.state, ...state };
  }

  updateStack(parentState, parentContext, location) {
    const routerTypeData = extractStack(location, parentContext.routeKeys);
    const order = routerTypeData[this.routeKey];

    return {
      visible: order != null,
      order,
      at: routerTypeData,
    };
  }

  updateScene(parentState, parentContext, location) {
    const routerTypeData = extractScene(location, parentContext.routeKeys, this.isPathRouter, this.routerLevel);
    const visible = routerTypeData[this.routeKey];
    // if (this.name === 'oScene') console.log(this.name, visible, this.visible)

    // if ( JSON.stringify(this.history.at) === JSON.stringify(routerTypeData)) return undefined;

    return {
      visible,
      order: undefined,
      at: routerTypeData,
    };
  }

  updateFeature(parentState, parentContext, location) {
    const routerTypeData = extractFeature(location, parentContext.routeKeys);
    const visible = routerTypeData[this.routeKey];

    return {
      visible,
      order: undefined,
      at: routerTypeData,
    };
  }

  updateData(parentState, parentContext, location) {
    // console.log('****', location)
    const routerTypeData = extractData(location, parentContext.routeKeys, this.isPathRouter, this.routerLevel, this);
    const visible = Object.values(routerTypeData).filter(i => i != null).length > 0;

    return {
      visible,
      order: undefined,
      at: routerTypeData,
    };
  }
}


const initalizeRouter = buildInitalizeRouterFn(Router);

export { Router as default, initalizeRouter, registerRouter };
