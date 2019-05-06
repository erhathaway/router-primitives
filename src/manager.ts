import { NativeSerializedStore, BrowserSerializedStore } from './serializedState';
import DefaultRouterStateStore from './routerState';
import DefaultRouter from './router/base';
import * as defaultTemplates from './router/template';
import { IRouterDeclaration, IRouter as RouterT, IRouterTemplate, IInputLocation, ILocationActionContext, RouterAction, IOutputLocation, IRouterInitParams, IRouterActionOptions, IRouterConfig, Observer, IRouterInitArgs, IRouter } from './types';

const capitalize = (name = '') => name.charAt(0).toUpperCase() + name.slice(1);

interface IInit {
  routerTree?: IRouterDeclaration;
  serializedStateStore?: NativeSerializedStore | BrowserSerializedStore;
  routerStateStore?: DefaultRouterStateStore;
  router?: typeof DefaultRouter;
  templates?: { [templateName: string]: IRouterTemplate };
}

export default class Manager {
  private static setChildrenDefaults(options: IRouterActionOptions, location: IInputLocation, router: RouterT, ctx: ILocationActionContext) {
    let newLocation = { ...location };
    Object.keys(router.routers).forEach((routerType) => {
      router.routers[routerType].forEach((child) => {
        // if the cached visibility state is 'false' don't show on rehydration
        if (child.cache.state === false) { return; }

        // if there is a cache state, show the router
        if (child.cache.state === true) {

          // the cache has been 'used' so remove it
          child.cache.removeCache();

          const newContext = { ...ctx, addingDefaults: true }; // TODO check if it makes sense to move addingDefaults to options
          newLocation = child.show(options, newLocation, child, newContext);
        }

        // if there is no cache state and there is a default action, apply the action
        else if (child.config.defaultAction && child.config.defaultAction.length > 0) {
          
          const [action, ...args] = child.config.defaultAction;
          
          const newContext = { ...ctx, addingDefaults: true };

          newLocation = (child as any)[action]({ ...options, data: args[0] }, newLocation, child, newContext);
        }
      });
    });

    return newLocation;
  }

  private static setCacheAndHide(options: IRouterActionOptions, location: IInputLocation, router: RouterT, ctx: ILocationActionContext = {}) {
    let newLocation = location;
    let disableCaching: boolean | undefined;

    // figure out if caching should occur
    if (router.config.disableCaching !== undefined) {
      disableCaching = router.config.disableCaching;
    } else {
      disableCaching = ctx.disableCaching || false;
    }

    Object.keys(router.routers).forEach((routerType) => {
      router.routers[routerType].forEach((child) => {
        // update ctx object's caching attr for this branch
        ctx.disableCaching = disableCaching;

        // call location action
        newLocation = child.hide({}, newLocation, child, ctx);
      });
    });

    // Use caching figured out above b/c the ctx object might get mutate when
    //   transversing the router tree
    // Also make sure there is a local request to disableCaching for this particular router (via options)
    if (!disableCaching && !options.disableCaching) {
      router.cache.setCacheFromLocation(newLocation, router);
    }
    return newLocation;
  }

  // wrapper around action function
  private static createActionWrapperFunction(action: RouterAction, type: string) {
    function actionWrapper(options: IRouterActionOptions = {}, existingLocation?: IOutputLocation, routerInstance = this, ctx: ILocationActionContext = {}) {
      // if called from another action wrapper
      let updatedLocation: IInputLocation;
      if (existingLocation) {
        // set cache before location changes b/c cache info is derived from location path
        if (type === 'hide') {
          updatedLocation = Manager.setCacheAndHide(options, existingLocation, routerInstance, ctx);
        }
        
        updatedLocation = action(options, existingLocation, routerInstance, ctx);

        if (type === 'show') { // add location defaults from children
          updatedLocation = Manager.setChildrenDefaults(options, updatedLocation, routerInstance, ctx);
        }

        return updatedLocation;
      }
      
      // if the parent router isn't visible, but the child is shown, show all parents
      if (type === 'show' && routerInstance.parent && (routerInstance.parent.state.visible === false || routerInstance.parent.state.visible === undefined)) { // data routers dont have a visiblity state by default. FIX THIS
        routerInstance.parent.show();
      }

      // if called directly, fetch location
      updatedLocation = this.manager.serializedStateStore.getState();

      // set cache before location changes b/c cache info is derived from location path
      if (type === 'hide') {
        updatedLocation = Manager.setCacheAndHide(options, updatedLocation, routerInstance, ctx);
      }

      updatedLocation = action(options, updatedLocation, routerInstance, ctx);

      if (type === 'hide' && routerInstance.state.visible === true) {
        routerInstance.cache.setCache(false);
      }

      if (type === 'show') { // add location defaults from children
        updatedLocation = Manager.setChildrenDefaults(options, updatedLocation, routerInstance, ctx);
      }

      // add user options to new location options
      updatedLocation.options = { ...updatedLocation.options, ...options };

      // set serialized state
      this.manager.serializedStateStore.setState(updatedLocation);
      // return location so the function signature of the action is the same
      return updatedLocation
    }

    return actionWrapper;
  }

  public routers: { [routerName: string]: RouterT };
  public rootRouter: RouterT;
  public serializedStateStore: IInit['serializedStateStore'];
  public routerStateStore: IInit['routerStateStore'];
  public routerTypes: { [routerType: string]: RouterT };
  public templates: IInit['templates'];

  constructor({ routerTree, serializedStateStore, routerStateStore, router, templates }: IInit = {}) {
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
    this.templates = { ...defaultTemplates, ...templates };
    this.routerTypes = {};

    // TODO implement
    // Manager.validateTemplates(templates);
    // validate all template names are unique
    // validation should make sure action names dont collide with any Router method names

    const Router = router || DefaultRouter; //tslint:disable-line
    Object.keys(this.templates).forEach((templateName) => {
      // create a RouterType off the base Router

      // extend router base for specific type
      class RouterType extends Router {}

      // change the router name to include the type
      Object.defineProperty(RouterType, 'name', { value: `${capitalize(templateName)}Router` });

      // fetch template
      const selectedTemplate = this.templates[templateName];

      // add actions to RouterType
      Object.keys(selectedTemplate.actions).forEach((actionName) => {
        (RouterType as any).prototype[actionName] = Manager.createActionWrapperFunction(selectedTemplate.actions[actionName], actionName);
      });

      // add reducer to RouterType
      (RouterType.prototype as RouterT).reducer = selectedTemplate.reducer;

      // add parser to RouterType
      // RouterType.prototype.parser = selectedTemplate.parser;

      this.routerTypes[templateName] = (RouterType as any as RouterT);
    });

    // add initial routers
    this.addRouters(routerTree);

    // subscribe to URL changes and update the router state when this happens
    // the subject (BehaviorSubject) will notify the observer of its existing state
    this.serializedStateStore.subscribeToStateChanges(this.setNewRouterState.bind(this));

    const newLocation = this.rootRouter.show();
  }

  /**
   * Adds the initial routers defined during initialization
   */
  public addRouters(router: IRouterDeclaration = null, type: string = null, parentName: string = null) {
    // If no router specified, there are no routers to add
    if (!router) { return; }

    // The type is derived by the relationship with the parent.
    //   Or has none, as is the case with the root router in essence
    //   Below, we are deriving the type and calling the add function recursively by type
    this.addRouter({ ...router, type, parentName });
    const childRouters = router.routers || {};
    Object.keys(childRouters).forEach((childType) => {
      childRouters[childType].forEach(child => this.addRouters(child, childType, router.name));
    });
  }


  public addRouter({ name, routeKey, disableCaching, isPathRouter, type, parentName, defaultAction }: IRouterDeclaration) {
    const config = {
      disableCaching,
      isPathRouter,
      // defaultShow: defaultShow || false,
      defaultAction,
      routeKey,
    };
    
    // create a router
    const router = this.createRouter({ name, config, type, parentName });
    // set as the parent router if this router has not parent and there is not yet a root
    if (!parentName && !this.rootRouter) {
      this.rootRouter = router;
    } else if (!parentName && this.rootRouter) {
      throw new Error('Root router already exists. You likely forgot to specify a parentName');
    } else if (this.routers[parentName] === undefined) {
      throw new Error('Parent of to be created router not found');
    } else {
      // fetch the parent, and assign a ref of it to this router
      const parent = this.routers[parentName];

      router.parent = parent;

      // add ref of new router to the parent
      const siblingTypes = parent.routers[type] || [];
      siblingTypes.push(router);
      parent.routers[type] = siblingTypes;
    }
    // add ref of new router to manager
    this.routers[name] = router;
  }

  // removing a router will also unset all of its children
  public removeRouter(name: string) {
    const router = this.routers[name];
    const { parent, routers, type } = router;

    // delete ref the parent (if any) stores
    if (parent) {
      const routersToKeep = parent.routers[type].filter(child => child.name !== name);
      parent.routers[type] = routersToKeep;
    }

    // recursively call this method for all children
    const childrenTypes = Object.keys(routers);
    childrenTypes.forEach((childType) => {
      routers[childType].forEach(childRouter => this.removeRouter(childRouter.name));
    });

    // remove router related state subscribers
    this.routerStateStore.unsubscribeAllObserversForRouter(name);

    // delete ref the manager stores
    delete this.routers[name];
  }

  public calcNewRouterState(location: IInputLocation, router: RouterT, ctx: ILocationActionContext = {}, newState: { [routerName: string]: {}} = {}) {
    if (!router) { return; }

    // calc new router state from new location and existing state
    if (!router.isRootRouter) { // TODO add tests for this
      newState[router.name] = router.reducer(location, router, ctx);
    }

    // recursive call all children to add their state
    Object.keys(router.routers)
      .forEach((type) => {
        router.routers[type]
          .forEach(childRouter => this.calcNewRouterState(location, childRouter, ctx, newState));
      });

    return newState;
  }

  protected validateRouterDeclaration(name: string, type: string, config: IRouterConfig): void {
        // check if the router type exists
    // if (!this.routerTypes[type] && type !== 'root') {
      // throw new Error(`The router type ${type} for router '${name}' does not exist. Consider creating a template for this type.`);
    // }
    // check if the router type has a router template 
    if (this.routers[name]) {
      throw new Error(`A router with the name '${name}' already exists.`);
    }

    // check if the router routeKey is unique
    if (config.routeKey) {
      const alreadyExists = Object.values(this.routers).reduce((acc, r) => {
        return acc || r.routeKey === config.routeKey
      }, false);
      if (alreadyExists) {
        throw new Error(`A router with the routeKey '${config.routeKey}' already exists`);
      }
    }
  }

  protected createNewRouterInitArgs({ name, config, type, parentName}: IRouterInitParams): IRouterInitArgs {
    // TODO add test
    if (!type) { throw new Error('Type required'); }

    const parent = this.routers[parentName];

    return {
      name,
      config: { ...config },
      type: type || 'root', // TODO make root router an empty router
      parent,
      routers: {},
      manager: this,
      root: this.rootRouter,
      getState: this.routerStateStore.createRouterStateGetter(name),
      subscribe: this.routerStateStore.createRouterStateSubscriber(name),
    };
  }

  protected createRouterFromInitArgs(initalArgs: ReturnType<Manager['createNewRouterInitArgs']>, routerActionNames: string[]) {
    const routerClass = this.routerTypes[initalArgs.type];
    // TODO add tests for passing of action names
    return new (routerClass as any)({ ...initalArgs, actions: routerActionNames }) as any as RouterT;
  }

  // location -> newState
  // newState -> routerStates :specify
  protected setNewRouterState(location: IInputLocation) {
    const newState = this.calcNewRouterState(location, this.rootRouter);
    this.routerStateStore.setState(newState);
  }

  // create router :specify
  protected createRouter({ name, config, type, parentName }: IRouterInitParams): RouterT {
    this.validateRouterDeclaration(name, type, config);

    // TODO add tests for this
    const routerType = !parentName && !this.rootRouter ? 'root' : type;

    const initalArgs = this.createNewRouterInitArgs({ name, config, type: routerType, parentName });
    // TODO add tests for extraction of action names
    const routerActionNames = Object.keys(this.templates[initalArgs.type].actions);

    const router = this.createRouterFromInitArgs(initalArgs, routerActionNames);

    return router;
  }
}
