import DefaultSerializedStateAdapter from './serializedState';
import DefaultRouterStateAdapater from './routerState';
// import { getGlobalState } from 'mobx/lib/internal';

export default class RouterManager {
  constructor({ routerTree, serializedStateAdapter, routersStateAdapter }) {
    this.serializedStateAdapter = serializedStateAdapter || new DefaultSerializedStateAdapter();
    this.routersStateAdapter = routerStateAdapter || new DefaultRouterStateAdapater();
    this.routers = {};
    this.rootRouter = null;

    // add initial routers
    this.addRouters(routerTree);

    // subscribe to URL changes and update the router state when this happens
    this.serializedStateAdapter.subscribeToStateChanges(this.setNewRouterState.bind(this));
  }

  /**
   * Adds the initial routers defined during initialization
   * @param {*} router 
   * 
   */
  addRouters(router = null, type = null, parent = null) {
    // if no router specified, there are no routers to add
    if (!router) { return };

    // the type might be derived by the relationship with the parent, 
    //   thus it maybe not explicitly exist on the router
    //   here we are deriving below and calling this function recursively
    this.addRouter({ ...router, type, parent });
    const childRouters = router.routers || {};
    Object.keys(childRouters).forEach(type => {
      childRouters[type].forEach(child => this.addRouters(child, type, router));
    });
  }

  // // subscribe to serializedStateAdapter and call this when changes
  // setNewRouterState(existingPathObj) {
  //   const newRouterState = this.rootRouter && this.rootRouter.update(newLocationObject); // will recursively call all child routers
  //   this.routerStateAdapter.setNewRouterState(newRouterState);
  // }

  addRouter({ name, routeKey, config, defaults, type, parent: parentName }) {
    // create a router
    const router = this.createRouter({ name, routeKey, config, defaults, type, parent: parentName });
    
    if (!parentName && !this.rootRouter) { 
      this.rootRouter = router;
    } else {
      // fetch the parent, and assign a ref of it to this router
      const parent = this.routers[parentName]
      router.parent = parent;
  
      // add ref of new router to the parent
      const siblingTypes = parent.routers[type] || []
      siblingTypes.push(router);
      parent.routers[type] = siblingTypes;
    }

    // add ref of new router to manager
    this.routers[name] = router; 
  }

  // wrapper around action function
  createActionWrapperFunction(action) {
    return () => {
      action();
    }
  }

  // returns a closure with the router ref in scope
  // uses this ref to map the updated state change of all routers to 1) state of just this router 2) state of sibling routers
  // these two pices are used to call the subscription function when the router is subscribed to by an observer
  // observer signature: (routerState, []siblingRouterState) => {}
  // createStateUpdateWrapperFunction(router) {
  //   return (fn) => {
  //     const subscription = (newState) => fn(newState[router.name], router.siblingNames.map(n => newState[n]));
  //     this.routersStateAdapter.createStateSubscriber(subscription)
  //   }
  // }

  // create router :specify
  createRouter({ name, routeKey, config, defaults, type, parent: parentName }) {
    // create new router
    const parent = this.routers[parentName];
    const newRouter = { 
      name, 
      routeKey, 
      config, 
      type, 
      parent, 
      routers: {},
      // siblingNames - getter
      // parentName - getter
      // neighborsNames - getter
      // getStateByName: getter
      root: this.rootRouter,
      getState: this.routersStateAdapter.createRouterStateGetter(name),
      // getAllRouterState: this.routersStateAdapter.getState,
      subscribe: this.routersStateAdapter.createRouterStateSubscriber(name),
    };

    newRouter['subscribe'] = this.createStateUpdateWrapperFunction(newRouter);

    
    // add actions from template
    const template = this.templates[type];
    const { actions } = template;
    Object.keys(actions).forEach((actionName) => {
      newRouter[actionName] = this.createActionWrapperFunction(actions[actionName]);
    })

    // add reducer from template
    newRouter['reducer'] = template.reducer;

    return newRouter;
  }

  // removing a router will also unset all of its children
  removeRouter(name) {
    const router = this.routers[name];
    const { parent, routers } = router;

    // delete ref the parent (if any) stores
    if (parent) {
      routersToKeep = parent.routers[type].filter(router => router.name !== name);
      parent.routers[type] = routersToKeep;
    }

    // recursively call this method for all children
    const childrenTypes = Object.keys(routers);
    childrenTypes.forEach(type => {
      routers[type].forEach(childRouter => this.removeRouter(childRouter.name))
    })

    // delete ref the manager storess
    delete this.routers[name];
  }

  // location -> newState
  // newState -> routerStates :specify
  setNewRouterState(location) {
    const newState = this.calcNewRouterState(location, this.rootRouter);
    this.routersStateAdapter.setState(newState);
  }

  calcNewRouterState(location, router, existingState = {}, ctx = {}, newState = {}) {
    if (!router) { return; }

    // calc new router state from new location and existing state
    newState[router.name] = router.reduce(location, existingState[router.name], ctx);

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
