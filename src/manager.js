import { NativeSerializedStore, BrowserSerializedStore } from './serializedState';
import DefaultRouterStateStore from './routerState';
import Router from './router/base';
import { scene, stack } from './router/template';

const capitalize = (string = '') => {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

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
    const templates = { scene, stack };
    this.routerTypes = {};

    // TODO implement
    // RouterManager.validateTemplates(templates);
    // validate all template names are unique
    // validation should make sure action names dont collide with any Router method names

    Object.keys(templates).forEach((templateName) => {
      // create a RouterType off the base Router

      // extend router base for specific type
      class RouterType extends Router {}

      // change the router name to include the type
      Object.defineProperty (RouterType, 'name', {value: `${capitalize(templateName)}Router`});
      
      // fetch template
      const selectedTemplate = templates[templateName];

      // add actions to RouterType
      Object.keys(selectedTemplate.actions).forEach((actionName) => {
        RouterType.prototype[actionName] = RouterManager.createActionWrapperFunction(selectedTemplate.actions[actionName]);
      });

      // add reducer to RouterType
      RouterType.prototype.reducer = selectedTemplate.reducer;

      // add parser to RouterType
      RouterType.prototype.parser = selectedTemplate.parser;

      this.routerTypes[templateName] = RouterType;
    });

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
  static createActionWrapperFunction(action) {
    function actionWrapper(existingLocation, routerInstance = this, ctx = {}) {
      // if called from another action wrapper
      if (existingLocation) {
        return action(existingLocation, routerInstance, ctx);
      } 

      // if called directly
      const location = this.manager.serializedStateStore.getState();
      const newLocation = action(location, routerInstance, ctx);

      // set serialized state
      this.manager.serializedStateStore.setState(newLocation);
    }
    return actionWrapper;
  }

  // create router :specify
  // config = {
  //   routeKey: 'overrides name
  //   mutateExistingLocation: boolean, default: false
  //   cacheState: boolean, default: null, is equal to true
  // }
  createRouter({ name, routeKey, config, defaults, type, parentName }) {
    const parent = this.routers[parentName];

    const initalParams = {
      name,
      // routeKey,
      config: { ...config, routeKey },
      type: type || 'scene', // make root routers a scene router TODO make root router an empty template
      parent,
      routers: {},
      manager: this,
      root: this.rootRouter,
      getState: this.routerStateStore.createRouterStateGetter(name),
      subscribe: this.routerStateStore.createRouterStateSubscriber(name),
      
      childCacheStore: this.childCacheStore,
    };
    
    const RouterType = this.routerTypes[type] || this.routerTypes['scene'];
    
    return new RouterType(initalParams);
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
    // console.log('location', location)
    const newState = this.calcNewRouterState(location, this.rootRouter);
    // console.log('STATE', newState)
    this.routerStateStore.setState(newState);
  }

  calcNewRouterState(location, router, ctx = {}, newState = {}) {
    if (!router) { return; }

    // calc new router state from new location and existing state
    newState[router.name] = router.reducer(location, router, ctx);

    // recursive call all children to add their state
    Object.keys(router.routers)
      .forEach(type => {
        router.routers[type]
          .forEach(childRouter => this.calcNewRouterState(location, childRouter, ctx, newState))
      });

    return newState;
  }
}
