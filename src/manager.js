import { NativeSerializedStore, BrowserSerializedStore } from './serializedState';
import DefaultRouterStateStore from './routerState';

const defaultReducer = () => ({}); // TODO REMOVE and default to Scene template
const defaultAction = () => ({ pathname: 'user1', search: ['hello', 'world'] }); // TODO REMOVE and default to Scene template

export default class RouterManager {
  constructor({ routerTree, serializedStateStore, routerStateStore } = {}) {
    this.routerStateStore = routerStateStore || new DefaultRouterStateStore();
    this.routers = {};
    this.rootRouter = null;

    // check if window 
    if (typeof window === 'undefined') {
      this.serializedStateStore = serializedStateStore || new NativeSerializedStore();
    } else {
      this.serializedStateStore = serializedStateStore || new BrowserSerializedStore();
    }

    // router types
    this.templates = {};

    // add initial routers
    this.addRouters(routerTree);

    // subscribe to URL changes and update the router state when this happens
    this.serializedStateStore.subscribeToStateChanges(this.setNewRouterState.bind(this));


    // childStateCache is used to store the state of a child tree of routers. 
    // Thus, when a router hides it can perseve the child state for proper rehydration
    // { [name] = this.state } // the current state
    this.childStateCache = {};
  }

  /**
   * Adds the initial routers defined during initialization
   * @param {*} router 
   * 
   */
  addRouters(router = null, type = null, parentName = null) {
    // If no router specified, there are no routers to add
    if (!router) { return; }

    // The type is derived by the relationship with the parent. 
    //   Or has none, as is the case with the root router in essence
    //   Below, we are deriving the type and calling the add function recursively by type
    this.addRouter({ ...router, type, parentName });
    const childRouters = router.routers || {};
    Object.keys(childRouters).forEach((childType) => {
      childRouters[childType].forEach(child => this.addRouters(child, childType, router.name ));
    });
  }

  // // subscribe to serializedStateStore and call this when changes
  // setNewRouterState(existingPathObj) {
  //   const newRouterState = this.rootRouter && this.rootRouter.update(newLocationObject); // will recursively call all child routers
  //   this.routerStateStore.setNewRouterState(newRouterState);
  // }

  addRouter({ name, routeKey, config, defaults, type, parentName }) {
    // create a router
    const router = this.createRouter({ name, routeKey, config, defaults, type, parentName });
    
    // set as the parent router if this router has not parent and there is not yet a root
    if (!parentName && !this.rootRouter) { 
      this.rootRouter = router;
    } else if (!parentName && this.rootRouter) {
      throw new Error('Root router already exists. You likely forgot to specify a parentName');
    } else {
      // fetch the parent, and assign a ref of it to this router
      const parent = this.routers[parentName];

      // TODO migrate code over to use <router>.addChildRouter method instead
      router.parent = parent;
  
      // add ref of new router to the parent
      const siblingTypes = parent.routers[type] || [];
      siblingTypes.push(router);
      parent.routers[type] = siblingTypes;
    } 
    // add ref of new router to manager
    this.routers[name] = router;
  }

  // wrapper around action function
  createActionWrapperFunction(action) {
    return () => {
      const newLocation = action();
      this.serializedStateStore.setState(newLocation);
    }
  }

  // returns a closure with the router ref in scope
  // uses this ref to map the updated state change of all routers to 1) state of just this router 2) state of sibling routers
  // these two pices are used to call the subscription function when the router is subscribed to by an observer
  // observer signature: (routerState, []siblingRouterState) => {}
  // createStateUpdateWrapperFunction(router) {
  //   return (fn) => {
  //     const subscription = (newState) => fn(newState[router.name], router.siblingNames.map(n => newState[n]));
  //     this.routerStateStore.createStateSubscriber(subscription)
  //   }
  // }

  // create router :specify
  // config = {
  //   routeKey: 'overrides name
  //   mutateExistingLocation: boolean, default: false
  //   cacheState: boolean, default: null, is equal to true
  // }
  createRouter({ name, config, defaults, type, parentName }) {
    // create new router

    const parent = this.routers[parentName];
    const newRouter = {
      name,
      // routeKey,
      config,
      type,
      parent,
      routers: {},
      // siblingNames - getter
      // parentName - getter
      // neighborsNames - getter
      // getStateByName: getter
      root: this.rootRouter,
      getState: this.routerStateStore.createRouterStateGetter(name),
      // getAllRouterState: this.routerStateStore.getState,
      subscribe: this.routerStateStore.createRouterStateSubscriber(name),
      
      childCacheStore: this.childCacheStore,
    };
    
    // newRouter['subscribe'] = this.createStateUpdateWrapperFunction(newRouter);
    
    
    // add actions from template
    const template = this.templates[type] || { reducer: defaultReducer, actions: {} };
    const { actions } = template;
    Object.keys(actions).forEach((actionName) => {
      newRouter[actionName] = this.createActionWrapperFunction(actions[actionName]);
    });
    
    // gets the value to be used for the cache
    // newRouter['getCacheValue']: this.templates.getCacheValue;

    // add reducer from template
    newRouter['reducer'] = template.reducer;

    return newRouter;
  }

  // removing a router will also unset all of its children
  removeRouter(name) {
    const router = this.routers[name];
    const { parent, routers, type } = router;

    // delete ref the parent (if any) stores
    if (parent) {
      const routersToKeep = parent.routers[type].filter(router => router.name !== name);
      parent.routers[type] = routersToKeep;
    }

    // recursively call this method for all children
    const childrenTypes = Object.keys(routers);
    childrenTypes.forEach((childType) => {
      routers[childType].forEach(childRouter => this.removeRouter(childRouter.name));
    });

    // delete ref the manager stores
    delete this.routers[name];
  }

  // location -> newState
  // newState -> routerStates :specify
  setNewRouterState(location) {
    const existingRouterState = this.routerStateStore.getState();
    const newState = this.calcNewRouterState(location, this.rootRouter, existingRouterState);
    this.routerStateStore.setState(newState);
  }

  calcNewRouterState(location, router, existingState = {}, ctx = {}, newState = {}) {
    if (!router) { return; }

    // calc new router state from new location and existing state
    newState[router.name] = router.reducer(location, existingState[router.name], ctx);

    Object.keys(router.routers)
      .forEach(type => {
        router.routers[type]
          .forEach(childRouter => this.calcNewRouterState(location, childRouter, existingState, ctx, newState))
      });

    return newState;
  }
}


// manager type implements subscription

// mobx router vs observable router
// mobx is state store
// mobx just has state values

// observable router
// -> getState
// -> subscribe

// routers have default, config, routers, name, routeKey
