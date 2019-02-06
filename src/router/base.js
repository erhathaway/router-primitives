import Cache from './cache';

export default class RouterBase {
  constructor(init = {}) {
    const { name, config, type, manager, parent, routers, root, defaultShow, getState, subscribe } = init;

    if (!name  || !type || !manager) { throw new Error('Missing required kwargs: name, type, and/or manager'); }
    // required
    this.name = name;
    this.config = config || {};
    this.type = type;
    this.actionNames = []; // used to map over the actions and replace with the actionHandler closure
    this.manager = manager;

    // optional
    this.parent = parent;
    this.routers = routers || {};
    this.root = root;

    // methods customized for instance from manager
    this.getState = getState;
    this.subscribe = subscribe;

    // default actions to call when immediate parent visibility changes from hidden -> visible
    this.defaultShow = defaultShow || false;

    // store the routers location data for rehydration
    this.cache = new Cache();
  }

  get routeKey() {
    return this.config.routeKey || this.name;
  }
  
  get shouldStoreLocationMutationInHistory() {
    return this.config.shouldStoreLocationMutationInHistory;
  }

  get siblings() {
    return this.parent.routers[this.type].filter(r => r.name !== this.name);
  }

  getNeighborsByType(type) {
    if (this.parent && this.parent.routers) {
      return this.parent.routers[type] || [];
    } 
    return [];
  }

  get pathLocation() {
    if (!this.parent) return -1;
    return 1 + this.parent.pathLocation;
  }

  get isRootRouter() {
    return !this.parent;
  }

  // TODO Remove testing dependency - this shouldn't be used since it bypasses the manager
  // Create utility function instead to orchestrate relationships between routers
  _addChildRouter(router) {
    if (!router.type) { throw new Error('Router is missing type'); }

    const siblingTypes = this.routers[router.type] || [];
    siblingTypes.push(router);
    this.routers[router.type] = siblingTypes;

    router.parent = this;
  }

  get isPathRouter() {
    // if there is no parent, we are at the root. The root is by default a path router since
    // it represents the '/' in a pathname location
    if (!this.parent) return true;
    // if this router was explicitly set to be a path router during config, return true
    if (this.config.isPathRouter && this.parent.isPathRouter) { return true; }
    // else if this router is a path router but its parent isn't we need to throw an error.
    // it is impossible to construct a path if all the parents are also not path routers
    if (this.config.isPathRouter) {
      throw new Error(`${this.type} router: ${this.name} is explicitly set to modify the pathname
        but one of its parent routers doesnt have this permission.
        Make sure all parents have 'isPathRouter' attribute set to 'true' in the router config OR
        Make sure all parents are of router type 'scene' or 'data'.
        If the routers parents have siblings of both 'scene' and 'data' the 'scene' router will always be used for the pathname
      `);
    }

    if (this.type === 'scene' && this.parent.isPathRouter) {
      // check to make sure neighboring data routers arent explicitly set to modify the pathname
      const neighboringDataRouters = this.getNeighborsByType('data'); // this.parent.routers.data || [];
      const isSiblingRouterExplictlyAPathRouter = neighboringDataRouters.reduce((acc, r) => (
        // check all data router neighbors and
        // make sure none have been explicitly set to be a path router
        acc || r.config.isPathRouter === true
      ), false);
      if (isSiblingRouterExplictlyAPathRouter === false) return true;
    } else if (this.type === 'data' && this.parent && this.parent.isPathRouter) {
      if (this._isPathRouter === false) return false;
      // check to make sure neighboring scene routers aren't present
      const neighboringSceneRouters = this.getNeighborsByType('scene');
      // if (neighboringSceneRouters.length === 0) return true;

      return (neighboringSceneRouters.length === 0) && !this.siblings.reduce((acc, r) => (
        // check all data router siblings and
        // make sure none are path routers
        acc || r.config.isPathRouter === true
      ), false);
    }

    return false;
  }

  get state() {
    if (!this.getState) { throw new Error('no getState function specified by the manager') }
    const { current } = this.getState();
    return current || {};
  }

  get history() {
    if (!this.getState) { throw new Error('no getState function specified by the manager') }
    const { historical } = this.getState();
    return historical || [];
  }
  // the write location is set by setting the 'options.writeLocation' in location to 'path' or 'query'
  // const options = {
  //   writeToPath
  // }

  // show(newLocation) {
  //   let location = rehydrateLocationFromCache(newLocation);

  //   ...etc
  //   return this.reduceChildren('show', location)
  // }
  
  // hide(newLocation) {
  //   calc new location ...etc
  //   let location = saveLocationToCache(location);
  //   return this.reduceChildren('hide', location)
  // }

  // modify location with default actions
  // static addLocationDefaults(location, routerInstance, ctx = {}) {
  //   // TODO validate default action names are on type
  //   let locationWithDefaults = { ...location };

  //   Object.keys(routerInstance.routers).forEach((type) => {
  //     routerInstance.routers[type].forEach((router) => {
  //       if (router.defaultShow || false) {
  //         const newContext = { ...ctx, addingDefaults: true };
  //         locationWithDefaults = router.show(locationWithDefaults, router, newContext);
  //       }
  //     });
  //   });
  //   return locationWithDefaults;
  // }

  rehydrateLocationFromCache(newLocation) {
    let location = newLocation;
    if (newLocation && (this.config.cache === null || this.config.restoreFromCache === true) && this.parentsAllowLocationCache) {
      // const cachedLocation = this.removeStateFromCache()
      const cachedLocation = this.manager.cacheStore.remove(this.name);

      location = this.joinLocationWithCachedLocation(location, cachedLocation)
    } 
    // else {
    //   location = this._show(location)
    // }

    return location;
  }

  saveLocationToCache(newLocation) {
    let location = newLocation;
    if (newLocation && (this.config.cache === null || this.config.restoreFromCache === true) && this.parentsAllowLocationCache) {
      const cachedLocation = this.calcCachedLocation(); // { pathLocation: 0-N, value } || { queryParam, value }
      this.manager.cachedStore.add(this.name, cachedLocation);

      location = this.joinLocationWithCachedLocation(location, cachedLocation);
    } 
    // else {
    //   location = this._hide(location)
    // }

    return location;
  }


  // addStateToCache() {
  //   this.manager.cachedStore.add(this.name, state);
  // }

  // removeStateFromCache() {
  //   const cachedLocation = this.manager.cacheStore.remove(this.name);
  //   return cachedLocation;
  // }

  // addBeforeHooks([], fn) {
  //   [].forEach(hook => hook())
  //   fn()
  // }

  // addAfterHooks([], fn) {
  //   fn
  // }

  // return pathLocation cached data types
  calcCachedLocation(globalState = null) {
    // reuse global state for efficiency if doing a recursive calculation
    const routerState = globalState
      ? globalState[this.name].current
      : this.state;

    if (this.isPathRouter) {
      if (this.type === 'data') { return { isPathData: true, pathLocation: this.pathLocation, value: routerState.data }}
      return { isPathData: true, pathLocation: this.pathLocation, value: routerState.visible }
    }

    // return queryParam cached data types
    if (this.type === 'data') { return { queryParam: this.routeKey, value: routerState.data }; }
    if (this.type === 'stack') { return { queryParam: this.routeKey, value: routerState.order }; }
    return { queryParam: this.routeKey, value: routerState.visible }
  }

  static joinLocationWithCachedLocation(location, cachedLocation) {
    const newLocation = Object.assign({}, location);
    if (cachedLocation.isPathData) {
      newLocation.path[cachedLocation.pathLocation] = cachedLocation.value;
    } else {
      newLocation.search[cachedLocation.queryParam] = cachedLocation.value;
    }
    return newLocation;
  }
  
  updateLocation(Options, newOptions) {
    // Only add the shouldStoreLocationMutationInHistory if it hasn't already explicitly been set.
    // The shouldStoreLocationMutationInHistory option prevents location mutation.
    // This prevents additional history from being added to location history.
    // Ex: You have modal popups and want the back button to return to the previous scene not close the modal
    // const { options } = location;
    // if (newOptions.shouldStoreLocationMutationInHistory && location.options.shouldStoreLocationMutationInHistory === undefined) {
    //   options = { ...options, ...newOptions };
    // }

    // delete newOptions.shouldStoreLocationMutationInHistory;
    // options = { ...options, ...newOptions };

    return { pathname: location.pathname, search: location.search, options };
  }

  // actionHandler(action) {
  //   return (location) => {
  //     // if no location has been specified, b/c this is the primary action call
  //     if (!location) {
  //       let newLocation = this.manager.location;
  //       const updatedLocation = action(newLocation);
  //       this.manager.setLocation(updatedLocation);
  //     } else {
  //       // if a location has been specified, this isn't the primary action call
  //       // the location should be returned such that the orignal action call can recieve it
  //       const updatedLocation = action(location);
  //       return updatedLocation;
  //     }
  //   }
  // }
}