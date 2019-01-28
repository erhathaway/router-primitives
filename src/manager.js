import DefaultSerializedStateAdapter from './serializedState';
import DefaultRouterStateAdapater from './routerState';

export default class RouterManager {
  constructor({ routerTree, serializedStateAdapter, routersStateAdapter }) {
    this.serializedStateAdapter = serializedStateAdapter || new DefaultSerializedStateAdapter();
    this.routersStateAdapter = routerStateAdapter || new DefaultRouterStateAdapater();
    this.routers = {};
    this.rootRouter = null;


    // add initial routers
    this.addRouters(routerTree);
    // routers have default, config, routers, name, routeKey
    // add routers from initial routerTree

    // bind serialized tate
    // bind routerState
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

  // subscribe to serializedStateAdapter and call this when changes
  setNewRouterState(existingPathObj) newPathObj {
    const newRouterState = this.rootRouter && this.rootRouter.update(newLocationObject); // will recursively call all child routers
    this.routerStateAdapter.setNewRouterState(newRouterState);
  }

  addRouter({ name, routeKey, config, default, type, parent: parentName }) {
    // create a router
    const router = this.createRouter({ name, routeKey, config, default, type, parent: parentName });
    
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

  createRouter({ name, routeKey, config, default, type, parent: parentName }) {
    // create new router
    const parent = this.routers[parentName];
    const newRouter = { name, routeKey, config, type, parent, routers: {} };
    
    // add actions from template
    const template = this.templates[type];
    const { actions } = template;
    Object.keys(actions).forEach(actionName => newRouter[actionName] = actions[actionName])

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

    // delete ref the manager stores
    delete this.routers[name];
  }
}
