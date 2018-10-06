// @flow

import { observable } from 'mobx';

import queryString from 'query-string';

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
  // RouterInterface,
  UpdateLocationOptions,
  Routers,
  RouterContext,
  RouterHistory,
  RouterType,
  RouterHooks,
  Location,
  RouterState,
  RouterConfig,
} from './types';

class Router {
  @observable visible: boolean = false;

  @observable order: ?number = undefined;

  @observable history: RouterHistory = { at: {}, from: {} };

  @observable state: RouterState = {
    at: undefined, from: undefined, data: undefined, visible: false, order: undefined,
  };

  _childTreeVisibilityOnHide: Object = {};

  _root: Router;

  set root(_: void) {
    throw 'Cannot set root router';
  }

  get root(): Router {
    if (this.parent) return this.parent.root;
    return this;
  }

  set childTreeVisibilityOnHide(childVisiblity: Object) {
    this.root._childTreeVisibilityOnHide[this.routeKey] = childVisiblity;
  }

  get childTreeVisibilityOnHide(): Object {
    return this.root._childTreeVisibilityOnHide[this.routeKey];
  }

  removeRouteKeyFromChildTreeVisibilityOnHide(routeKeyToDelete: string) {
    const allRecordings = this.root._childTreeVisibilityOnHide;
    const allRoutersWithVisibilityRecordings = Object.keys(allRecordings);
    allRoutersWithVisibilityRecordings.forEach((rK) => {
      const recording: Object = allRecordings[rK];
      if (recording && recording[routeKeyToDelete] != null) {
        delete recording[routeKeyToDelete];
        allRecordings[rK] = recording;
      }
    });

    this.root._childTreeVisibilityOnHide = allRecordings;
  }

  routeKey: string;

  name: string;

  data = undefined;

  _routers: Routers<Router> = {};

  _hooks: RouterHooks;

  _parent: ?Router = undefined;

  _type: RouterType;

  _isPathRouter = undefined;

  _mutateLocationOnSceneUpdate: boolean = false;

  _mutateLocationOnStackUpdate: boolean = true;

  _mutateLocationOnDataUpdate: boolean = false;

  _mutateLocationOnFeatureUpdate: boolean = false;

  set mutateLocationOnSceneUpdate(shouldMutate: boolean) {
    this.root._mutateLocationOnSceneUpdate = shouldMutate;
  }

  get mutateLocationOnSceneUpdate() {
    return this.root._mutateLocationOnSceneUpdate;
  }

  set mutateLocationOnStackUpdate(shouldMutate: boolean) {
    this.root._mutateLocationOnStackUpdate = shouldMutate;
  }

  get mutateLocationOnStackUpdate() {
    return this.root._mutateLocationOnStackUpdate;
  }

  set mutateLocationOnDataUpdate(shouldMutate: boolean) {
    this.root._mutateLocationOnDataUpdate = shouldMutate;
  }

  get mutateLocationOnDataUpdate() {
    return this.root._mutateLocationOnDataUpdate;
  }

  set mutateLocationOnFeatureUpdate(shouldMutate: boolean) {
    this.root._mutateLocationOnFeatureUpdate = shouldMutate;
  }

  get mutateLocationOnFeatureUpdate() {
    return this.root._mutateLocationOnFeatureUpdate;
  }

  // undefined so it can be explicitly set to true or false to override parent settings
  _rehydrateChildRoutersState: ?boolean = undefined;

  static updateSetLocationOptions(location: Location, newOptions: UpdateLocationOptions): Location {
    // only add the mutateExistingLocation if it hasn't already explicitly been set
    // for example, if another router doesnt want the mutation, its important not to mutate interval
    // so we still have route history
    let { options } = location;
    if (newOptions.mutateExistingLocation && location.options.mutateExistingLocation === undefined) {
      options = { ...options, ...newOptions };
    }
    delete newOptions.mutateExistingLocation;
    options = { ...options, ...newOptions };

    return { pathname: location.pathname, search: location.search, options };
  }

  static searchString() {
    return window.location.search || '';
  }

  static pathnameString() {
    return window.location.pathname || '';
  }

  static routerLocation(): Location {
    const search = (queryString.parse(Router.searchString(), { decode: true, arrayFormat: 'bracket' }): Object);
    const pathname = (Router.pathnameString().split('/'): Array<string>);
    // return { pathname: Router.pathnameString(), search: Router.searchString() };
    return { search, pathname, options: { mutateExistingLocation: undefined } };
  }

  static capitalize(string: string = ''): string {
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
      mutateLocationOnSceneUpdate,
      mutateLocationOnStackUpdate,
      mutateLocationOnDataUpdate,
      mutateLocationOnFeatureUpdate,
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

    if (mutateLocationOnSceneUpdate) this.mutateLocationOnSceneUpdate = mutateLocationOnSceneUpdate;
    if (mutateLocationOnStackUpdate) this.mutateLocationOnStackUpdate = mutateLocationOnStackUpdate;
    if (mutateLocationOnDataUpdate) this.mutateLocationOnDataUpdate = mutateLocationOnDataUpdate;
    if (mutateLocationOnFeatureUpdate) this.mutateLocationOnFeatureUpdate = mutateLocationOnFeatureUpdate;

    this.show = this.show.bind(this);
    this.hide = this.hide.bind(this);
    this.bringToFront = this.bringToFront.bind(this);
    this.sendToBack = this.sendToBack.bind(this);
    this.moveForward = this.moveForward.bind(this);
    this.moveBackward = this.moveBackward.bind(this);
  }

  set parent(parentRouter: Router) {
    this._parent = parentRouter;
  }

  get parent(): ?Router { return this._parent; }

  set type(routerType: RouterType) {
    this._type = routerType;
  }

  get type(): RouterType { return this._type; }

  set routers(routers: Routers<Router> = {}) {
    this._routers = { ...this.routers, ...routers };

    const routerTypes = (Object.keys(this.routers): Array<RouterType>);
    routerTypes.forEach((type) => {
      this.routers[type].forEach((r) => {
        (r: Router).parent = this; // eslint-disable-line no-param-reassign
        (r: Router).type = type; // eslint-disable-line no-param-reassign
      });
    });
  }

  get routers(): Routers<Router> { return this._routers; }

  set hooks(hooks: RouterHooks) {
    this._hooks = { ...this.hooks, ...hooks };
  }

  get hooks() { return this._hooks; }

  get isPathRouter(): boolean {
    if (!this.parent) return true;
    // if this router was explicitly set to be a path router
    if (this._isPathRouter && this.parent.isPathRouter) { return true; }
    if (this._isPathRouter) {
      throw `${this.type} router: ${this.name} is explicitly set to modify the pathname
        but one of its parent routers doesnt have this permission.
        Make sure all parents have 'isPathRouter' attribute set to 'true' in the router config OR
        Make sure all parents are of router type 'scene' or 'data'.
        If the routers parents have siblings of both 'scene' and 'data' the 'scene' router will always be used for the pathname
      `;
    }

    if (this.type === 'scene' && this.parent.isPathRouter) {
      // check to make sure sibling data routers arent explicitly set to modify the pathname
      // const siblingRouters = Object.keys(this.parent.routers.data || {});
      const siblingRouters = this.parent.routers.data || [];
      const isSiblingRouterExplictlyAPathRouter = siblingRouters.reduce((acc, r) => {
        // check all data router siblings and
        // make sure none have been explicitly set to be a path router
        return acc || r._isPathRouter === true;
        // const childRouter = (((this: Router).parent: Router).routers.data[r]: Router);
      }, false);

      if (isSiblingRouterExplictlyAPathRouter === false) return true;
    } else if (this.type === 'data' && this.parent && this.parent.isPathRouter) {
      if (this._isPathRouter === false) return false;
      // check to make sure sibling scene routers aren't present
      // const siblingRouters = Object.keys(this.parent.routers.scene || {});
      const siblingRouters = this.parent.routers.scene || [];

      if (siblingRouters.length === 0) return true;
    }

    return false;
  }

  get routerLevel(): number {
    if (!this.parent) return 0;
    return 1 + this.parent.routerLevel;
  }

  updateLocationViaMethod(location: Location, methodNamePrefix: string): Location {
    const methodName = `${methodNamePrefix}${Router.capitalize(this.type)}`;
    if (methodName === methodNamePrefix) {
      throw `router type attribute is undefined for router with name: ${this.name}`;
    }

    try {
      // an object with { pathname, search }
      // where pathname is a string
      // and search is an object of routeKeys belonging to a routerType
      // and their value (usually boolean | int)
      const newLocation = (this[methodName](location): Location);
      return newLocation;
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

  isDescendentOf(parentKey: string): boolean {
    if (this.parent) {
      return this.routeKey === parentKey || this.parent.isDescendentOf(parentKey);
    }
    return this.routeKey === parentKey;
  }

  rollBackToMostRecentState({ pathname, search, options }: Location, router: Router, ctx: { previousVisibility: Object }): Location {
    const { previousVisibility } = ctx;
    if (previousVisibility[router.routeKey] === false || previousVisibility[router.routeKey] == null) return { pathname, search, options };

    if (this.isPathRouter && router.type === 'data') {
      pathname[router.routerLevel] = router.state && router.state.data ? router.state.data : undefined;
    } else if (this.isPathRouter) {
      pathname[router.routerLevel] = previousVisibility[router.routeKey];
    } else if (router.type === 'data') {
      search[router.routeKey] = router.state ? router.state.data : router.data;
    } else {
      search[router.routeKey] = previousVisibility[router.routeKey];
    }
    return { pathname, search, options };
  }

  useDefault(location: Location) {
    return location;
  }

  // repopulate tree state
  static updateLocationFnShow(newLocation: Location, router: Router, ctx: Object): Location {
    if (router.routeKey === ctx.originRouteKey) { return router.show(false, newLocation); }
    if (router.isDescendentOf(ctx.originRouteKey)) {
      if ((router._rehydrateChildRoutersState !== false) && (router._rehydrateChildRoutersState || ctx.rehydrateChildRoutersState)) {
        return router.rollBackToMostRecentState(newLocation, router, ctx);
      }
      if (router.hasDefault) {
        return router.useDefault(newLocation);
      }
    }
    return newLocation;
  }

  static updateLocationFnHide(location: Location, router: Router, ctx: Object): Location {
    const locationToUseOnChild: Location = { pathname: location.pathname, search: location.search, options: location.options };
    const updatedLocation = (router.hide(false, locationToUseOnChild): Location);

    const existingSearch = typeof (location.search) === 'object' ? location.search : {};
    return { pathname: updatedLocation.pathname, search: { ...existingSearch, ...updatedLocation.search }, options: location.options };
  }

  static getChildTreeVisibility(router: Router): Object {
    const childRouterTypes = (Object.keys(router.routers): Array<RouterType>);
    return childRouterTypes.reduce((acc, type) => {
      router.routers[type].forEach((childRouter) => {
        if (childRouter.visible && childRouter.type === 'scene' && childRouter.isPathRouter) {
          acc[childRouter.routeKey] = childRouter.routeKey;
        } else if (childRouter.visible && childRouter.type === 'stack') {
          acc[childRouter.routeKey] = childRouter.order;
        } else {
          acc[childRouter.routeKey] = childRouter.visible;
        }
      });
      return acc;
    }, {});
  }

  // fold a fn over a node and all its child nodes
  static reduceStateTree(location: Location, router: Router, fn: (Location, Router, Object) => Location, ctx: Object): Location {
    const newLocation = fn(location, router, ctx);
    const childRouterTypes = (Object.keys(router.routers): Array<RouterType>);

    return childRouterTypes.reduce((locationA, type) => {
      return router.routers[type].reduce((locationB, childRouter) => {
        const newCtx = { ...ctx, rehydrateChildRoutersState: childRouter._rehydrateChildRoutersState || ctx.rehydrateChildRoutersState };
        return this.reduceStateTree(locationB, childRouter, fn, newCtx);
      }, locationA);
    }, newLocation);
  }

  // all routers implement this method
  show: Function;

  show(isOriginalCall: boolean = true, existingLocation: Location): Location {
    const METHOD_NAME_PREFIX = 'show';
    const oldLocation = existingLocation || Router.routerLocation();

    if (isOriginalCall && !this.visible) {
      // if a direct call was made to a show method, make sure some other router cant later
      // change the state by rehydrating from the cached child tree visiblity
      this.removeRouteKeyFromChildTreeVisibilityOnHide(this.routeKey);

      const ctx = {
        originRouteKey: this.routeKey,
        rehydrateChildRoutersState: this._rehydrateChildRoutersState,
        previousVisibility: { ...this.childTreeVisibilityOnHide },
      };
      this.childTreeVisibilityOnHide = {};

      const newLocation = Router.reduceStateTree(oldLocation, this, Router.updateLocationFnShow, ctx);

      setLocation(newLocation, oldLocation);
      return newLocation;
    }
    this.childTreeVisibilityOnHide = {};

    const newLocation = this.updateLocationViaMethod(oldLocation, METHOD_NAME_PREFIX);
    return newLocation;
  }

  hide: Function;

  // all routers implement this method
  hide(isOriginalCall: boolean = true, existingLocation: Location): Location {
    const METHOD_NAME_PREFIX = 'hide';
    const oldLocation = existingLocation || Router.routerLocation();

    if (isOriginalCall && this.visible) {
      // capture stte of sub tree so on show we can repopulate it correctly
      this.childTreeVisibilityOnHide = Router.getChildTreeVisibility(this);
      const ctx = {
        originRouteKey: this.routeKey,
        rehydrateChildRoutersState: this._rehydrateChildRoutersState,
        originalLocation: oldLocation,
      };

      const newLocation = Router.reduceStateTree(oldLocation, this, Router.updateLocationFnHide, ctx);

      setLocation(newLocation, oldLocation);
      return newLocation;
    }
    const newLocation = this.updateLocationViaMethod(oldLocation, METHOD_NAME_PREFIX);
    return newLocation;
  }

  moveForward: Function;

  // only stack router implements this method
  moveForward() {
    const METHOD_NAME_PREFIX = 'moveForward';
    const oldLocation = Router.routerLocation();
    const newLocation = this.updateLocationViaMethod(oldLocation, METHOD_NAME_PREFIX);

    setLocation(newLocation, oldLocation);
  }

  moveBackward: Function;

  // only stack router implements this method
  moveBackward() {
    const METHOD_NAME_PREFIX = 'moveBackward';
    const oldLocation = Router.routerLocation();
    const newLocation = this.updateLocationViaMethod(oldLocation, METHOD_NAME_PREFIX);

    setLocation(newLocation, oldLocation);
  }

  bringToFront: Function;

  // only stack router implements this method
  bringToFront() {
    const METHOD_NAME_PREFIX = 'bringToFront';
    const oldLocation = Router.routerLocation();
    const newLocation = this.updateLocationViaMethod(oldLocation, METHOD_NAME_PREFIX);

    setLocation(newLocation, oldLocation);
  }

  sendToBack: Function;

  // only stack router implements this method
  sendToBack() {
    const METHOD_NAME_PREFIX = 'sendToBack';
    const oldLocation = Router.routerLocation();
    const newLocation = this.updateLocationViaMethod(oldLocation, METHOD_NAME_PREFIX);

    setLocation(newLocation, oldLocation);
  }

  /* -------------------------------------
  ROUTER SPECIFIC METHODS FOR LOCATION UPDATING
  ----------------------------------------*/

  /* SCENE SPECIFIC */
  showScene(location: Location): Location {
    const { options } = Router.updateSetLocationOptions(location, { mutateExistingLocation: this.mutateLocationOnSceneUpdate });
    let search = {};

    // if router has a parent, get sibling router types and set visiblity to false
    // also used to clear existing search state related to router type which is useful for debuging
    if (this.parent) {
      this.parent.routers[this.type].forEach((r) => {
        if (r.routeKey !== this.routeKey) {
          const updatedLocation = r.hide();
          search = { ...search, ...updatedLocation.search };
        } else {
          search[r.routeKey] = undefined;
        }
      });
    }

    // if router is a pathrouter update the pathname
    if (this.isPathRouter) {
      // dont update pathname if parent isn't visible
      if (this.parent && !this.parent.visible) return location;

      const { pathname } = location;
      pathname[this.routerLevel] = this.routeKey;
      const newPathname = pathname.slice(0, this.routerLevel + 1);

      return { pathname: newPathname, search, options };
    }

    search[this.routeKey] = true;

    return { pathname: location.pathname, search, options };
  }

  hideScene(location: Location): Location {
    const { options } = Router.updateSetLocationOptions(location, { mutateExistingLocation: this.mutateLocationOnSceneUpdate });
    const search = {};

    // if router has a parent, get sibling router types and set visiblity to false
    // also used to clear existing search state related to router type which is useful for debuging
    if (this.parent) {
      this.parent.routers[this.type].forEach((r) => { search[r.routeKey] = undefined; });
    }

    if (this.isPathRouter) {
      const { pathname } = location;
      const newPathname = pathname.slice(0, this.routerLevel);

      return { pathname: newPathname, search, options };
    }
    return { pathname: location.pathname, search, options };
  }

  /* STACK SPECIFIC */
  // takes an object of keys where the value's
  // represent order and turns it into an array of ordered keys
  static orderStackRouteKeys(routeKeyOrderObj: { [string]: number }): Array<string> {
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
      if (value != null && !Number.isNaN(value)) {
        acc[routeKeyOrderObj[key]] = key;
      }
      return acc;
    }, {});

    const orders = Object.values(routeKeyOrderObj);
    const filteredOrders = ((orders.filter(n => n != null && !Number.isNaN(n)): any): Array<number>);
    const sortedOrders = filteredOrders.sort((a, b) => a - b);
    const sortedKeys = sortedOrders.map(order => orderAsKey[order]);
    return sortedKeys;
  }

  showStack(location: Location): Location {
    if (!this.parent) return location;

    // get routeKeys that belong to this router type
    const typeRouterRouteKeys = this.parent.routers[this.type].map(t => t.routeKey);
    // get current order for all routeKeys via the location state
    const routerTypeData = extractStack(location, typeRouterRouteKeys);
    const sortedKeys = Router.orderStackRouteKeys(routerTypeData);


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

    const { options } = Router.updateSetLocationOptions(location, { mutateExistingLocation: this.mutateLocationOnStackUpdate });

    return { pathname: location.pathname, search, options };
  }

  hideStack(location: Location): Location {
    if (!this.parent) return location;

    // get routeKeys that belong to this router type
    const typeRouterRouteKeys = this.parent.routers[this.type].map(t => t.routeKey);
    // get current order for all routeKeys via the location state
    const routerTypeData = extractStack(location, typeRouterRouteKeys);
    const sortedKeys = Router.orderStackRouteKeys(routerTypeData);

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
    const { options } = Router.updateSetLocationOptions(location, { mutateExistingLocation: this.mutateLocationOnStackUpdate });

    return { pathname: location.pathname, search, options };
  }

  moveForwardStack(location: Location): Location {
    if (!this.parent) return location;

    // get routeKeys that belong to this router type
    const typeRouterRouteKeys = this.parent.routers[this.type].map(t => t.routeKey);
    // get current order for all routeKeys via the location state
    const routerTypeData = extractStack(location, typeRouterRouteKeys);
    const sortedKeys = Router.orderStackRouteKeys(routerTypeData);


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

    const { options } = Router.updateSetLocationOptions(location, { mutateExistingLocation: this.mutateLocationOnStackUpdate });


    return { pathname: location.pathname, search, options };
  }

  moveBackwardStack(location: Location): Location {
    if (!this.parent) return location;

    // get routeKeys that belong to this router type
    const typeRouterRouteKeys = this.parent.routers[this.type].map(t => t.routeKey);
    // get current order for all routeKeys via the location state
    const routerTypeData = extractStack(location, typeRouterRouteKeys);
    const sortedKeys = Router.orderStackRouteKeys(routerTypeData);


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

    const { options } = Router.updateSetLocationOptions(location, { mutateExistingLocation: this.mutateLocationOnStackUpdate });

    return { pathname: location.pathname, search, options };
  }

  bringToFrontStack(location: Location): Location {
    const newLocation = Router.updateSetLocationOptions(location, { mutateExistingLocation: this.mutateLocationOnStackUpdate });

    return this.showStack(newLocation);
  }

  sendToBackStack(location: Location): Location {
    if (!this.parent) return location;

    // get routeKeys that belong to this router type
    const typeRouterRouteKeys = this.parent.routers[this.type].map(t => t.routeKey);
    // get current order for all routeKeys via the location state
    const routerTypeData = extractStack(location, typeRouterRouteKeys);
    const sortedKeys = Router.orderStackRouteKeys(routerTypeData);

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

    const { options } = Router.updateSetLocationOptions(location, { mutateExistingLocation: this.mutateLocationOnStackUpdate });

    return { pathname: location.pathname, search, options };
  }

  /* FEATURE ROUTER SPECIFIC */
  showFeature(location: Location): Location {
    const search = { [this.routeKey]: true };
    const { options } = Router.updateSetLocationOptions(location, { mutateExistingLocation: this.mutateLocationOnFeatureUpdate });

    return { pathname: location.pathname, search, options };
  }

  hideFeature(location: Location): Location {
    const search = { [this.routeKey]: undefined };
    const { options } = Router.updateSetLocationOptions(location, { mutateExistingLocation: this.mutateLocationOnFeatureUpdate });

    return { pathname: location.pathname, search, options };
  }

  /* DATA ROUTER SPECIFIC */
  showData(location: Location): Location {
    if (!this.parent) return location;

    const { options } = Router.updateSetLocationOptions(location, { mutateExistingLocation: this.mutateLocationOnDataUpdate });

    if (this.isPathRouter) {
      const search = {};
      // dont update pathname if parent isn't visible
      if (!this.parent.visible) return { pathname: location.pathname, search, options: location.options };

      const { pathname } = location;
      pathname[this.routerLevel] = this.state.data;
      return { pathname, search, options };
    }

    const search = { [this.routeKey]: this.state ? this.state.data : undefined };

    return { pathname: location.pathname, search, options };
  }

  hideData(location: Location): Location {
    const search = { [this.routeKey]: undefined };
    const { options } = Router.updateSetLocationOptions(location, { mutateExistingLocation: this.mutateLocationOnDataUpdate });

    if (this.isPathRouter) {
      const { pathname } = location;
      const newPathname = pathname.slice(0, this.routerLevel);
      return { pathname: newPathname, search, options };
    }

    return { pathname: location.pathname, search, options };
  }

  setData(data: string) {
    this.state.data = data;
    this.show();
  }

  _update(newLocation: Location): void {
    const location = newLocation;

    const routerTypes = (Object.keys(this.routers): Array<RouterType>);
    routerTypes.forEach((type) => {
      // pass new location to child routers
      const routers = this.routers[type];
      if (Array.isArray(routers)) {
        // add all routeKeys that belong to this router type
        const context = { routeKeys: routers.map(t => t.routeKey) };
        routers.forEach((r) => {
          try {
            // get new state for specific router
            const newRouterState = (r[`update${Router.capitalize(type)}`](r.state, context, location): RouterState);
            if (newRouterState) r.setState(newRouterState);
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
    });
  }

  setState(state: RouterState): void {
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

  updateStack(parentState: RouterState, parentContext: RouterContext, location: Location): RouterState {
    const routerTypeData = extractStack(location, parentContext.routeKeys);
    const order = routerTypeData[this.routeKey];

    return {
      visible: order != null,
      order,
      at: routerTypeData,
    };
  }

  updateScene(parentState: RouterState, parentContext: RouterContext, location: Location): RouterState {
    const routerTypeData = extractScene(location, parentContext.routeKeys, this.isPathRouter, this.routerLevel);
    const visible = routerTypeData[this.routeKey];

    return {
      visible,
      order: undefined,
      at: routerTypeData,
    };
  }

  updateFeature(parentState: RouterState, parentContext: RouterContext, location: Location): RouterState {
    const routerTypeData = extractFeature(location, parentContext.routeKeys);
    const visible = routerTypeData[this.routeKey];

    return {
      visible,
      order: undefined,
      at: routerTypeData,
    };
  }

  updateData(parentState: RouterState, parentContext: RouterContext, location: Location): RouterState {
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
