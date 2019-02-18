import Cache from './cache';
import { RouterState, Router, RouterCurrentState, RouterHistoryState } from '../types';

interface Config {
  routeKey?: string;
  shouldStoreLocationMutationInHistory?: boolean;
  isPathRouter?: boolean;
}

interface ChildRouters {
  [key: string]: Router[]
}

type Observer = (state: RouterState) => any;

interface InitParams {
  name: string;
  type: string;
  manager: any; // TODO replace once manager has a type def
  config: Config;
  parent: Router;
  routers: ChildRouters;
  root: Router;
  defaultShow?: boolean; // TODO move into config
  disableCaching?: boolean; // TODO move into config
  getState: () => RouterState;
  subscribe: (observer: Observer) => void;

}
export default class RouterBase {
  name: InitParams['name'];
  config: InitParams['config'];
  type: InitParams['type'];
  manager: InitParams['manager'];
  parent: InitParams['parent'];
  routers: InitParams['routers'];
  root: InitParams['root'];
  getState: InitParams['getState'];
  subscribe: InitParams['subscribe'];
  defaultShow: InitParams['defaultShow'];
  disableCaching: InitParams['disableCaching'];
  cache: Cache;

  constructor(init: InitParams) {
    const { name, config, type, manager, parent, routers, root, defaultShow, disableCaching, getState, subscribe } = init;

    if (!name || !type || !manager) { throw new Error('Missing required kwargs: name, type, and/or manager'); }
    // required
    this.name = name;
    this.config = config || {};
    this.type = type;
    // this.actionNames = []; // used to map over the actions and replace with the actionHandler closure
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
    this.disableCaching = disableCaching;

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

  getNeighborsByType(type: string): Router[] {
    if (this.parent && this.parent.routers) {
      return this.parent.routers[type] || [];
    }
    return [];
  }

  get pathLocation(): number {
    if (!this.parent) return -1;
    return 1 + this.parent.pathLocation;
  }

  get isRootRouter() {
    return !this.parent;
  }

  // TODO Remove testing dependency - this shouldn't be used since it bypasses the manager
  // Create utility function instead to orchestrate relationships between routers
  _addChildRouter(router: Router) {
    if (!router.type) { throw new Error('Router is missing type'); }

    const siblingTypes = (this.routers[router.type] || []) as Router[];
    siblingTypes.push(router);
    this.routers[router.type] = siblingTypes;

    router.parent = (this as any as Router);
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
      const neighboringDataRouters = this.getNeighborsByType('data');
      const isSiblingRouterExplictlyAPathRouter = neighboringDataRouters.reduce((acc, r) => (
        // check all data router neighbors and
        // make sure none have been explicitly set to be a path router
        acc || r.config.isPathRouter === true
      ), false);
      if (isSiblingRouterExplictlyAPathRouter === false) return true;
    } else if (this.type === 'data' && this.parent && this.parent.isPathRouter) {
      if (this.isPathRouter === false) return false;
      // check to make sure neighboring scene routers aren't present
      const neighboringSceneRouters = this.getNeighborsByType('scene');

      return (neighboringSceneRouters.length === 0) && !this.siblings.reduce((acc, r) => (
        // check all data router siblings and
        // make sure none are path routers
        acc || r.config.isPathRouter === true
      ), false);
    }

    return false;
  }

  get state(): RouterCurrentState {
    if (!this.getState) { throw new Error('no getState function specified by the manager'); }
    const { current } = this.getState();
    return current || {};
  }

  get history(): RouterHistoryState {
    if (!this.getState) { throw new Error('no getState function specified by the manager'); }
    const { historical } = this.getState();
    return historical || [];
  }

  // TODO deprecate this method and remove tests
  // return pathLocation cached data types
  calcCachedLocation(globalState: any = null) {
    // reuse global state for efficiency if doing a recursive calculation
    const routerState = globalState
      ? globalState[this.name].current
      : this.state;

    if (this.isPathRouter) {
      if (this.type === 'data') { return { isPathData: true, pathLocation: this.pathLocation, value: routerState.data }; }
      return { isPathData: true, pathLocation: this.pathLocation, value: routerState.visible };
    }

    // return queryParam cached data types
    if (this.type === 'data') { return { queryParam: this.routeKey, value: routerState.data }; }
    if (this.type === 'stack') { return { queryParam: this.routeKey, value: routerState.order }; }
    return { queryParam: this.routeKey, value: routerState.visible };
  }

  // TODO deprecate this function and remove tests
  static joinLocationWithCachedLocation(location: any, cachedLocation: any) {
    const newLocation = { ...location };
    if (cachedLocation.isPathData) {
      newLocation.path[cachedLocation.pathLocation] = cachedLocation.value;
    } else {
      newLocation.search[cachedLocation.queryParam] = cachedLocation.value;
    }
    return newLocation;
  }
}
