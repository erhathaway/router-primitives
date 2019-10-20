import { IRouterState, IRouterCurrentState, Observer } from "./types";

interface IStore {
  [key: string]: IRouterState;
}

interface IConfig {
  historySize: number;
}


/**
 * The default router state store.
 * This store keeps track of each routers state which is derived from the current location
 * This store can be swaped out in the manager with other stores. For example, a redux store.
 * Stores must implement the methods:
 *   setState
 *   getState
 *   createRouterStateGetter
 *   createRouterStateSubscriber
 */
export default class DefaultRoutersStateStore {
  private store: IStore;
  private config: IConfig;
  private observers: { [key: string]: Observer[] }

  constructor(store?: IStore, config: IConfig = { historySize: 2 }) {
    this.store = store || {};
    this.config = config;
    this.observers = {}; // key is routerName
  }

  /**
   * Sets the state of the router state store by adding to the history.
   * Adding state will completly overwrite existing state.
   * If the new contains routers whose state is identical to old state
   *   the router callbacks wont be called for this router. Otherwise, if the state
   *   has changed in any way, callback will be fired off for the router.
   */
  public setState(desiredRouterStates: { [key: string]: IRouterCurrentState }) {
    const routerNames = Object.keys(desiredRouterStates);
    // Keeps track of which routers have new state.
    // Used to notify observers of new state changes on a router by router level
    const hasUpdatedTracker = [] as string[];

    this.store = routerNames.reduce((routerStates, routerName) => {
      // extract current and historical states
      const { current: prevCurrent, historical } = routerStates[routerName] || { current: {}, historical: [] };
      const newCurrent = desiredRouterStates[routerName];

      // skip routers who haven't been updated
      // TODO test performance of this JSON.stringify comparison
      if (JSON.stringify(newCurrent) === JSON.stringify(prevCurrent)) { return routerStates; }

      // clone historical states
      let newHistorical = historical.slice();

      // check to make sure there is state to record into history
      if (Object.keys(prevCurrent).length > 0) {
        // add current to historical states
        newHistorical.unshift(prevCurrent);
      }

      // enforce history size
      if (newHistorical.length > this.config.historySize) { newHistorical = newHistorical.slice(0, this.config.historySize); }
      // update state to include new router state
      routerStates[routerName] = { current: newCurrent, historical: newHistorical };

      // record which routers have had a state change
      hasUpdatedTracker.push(routerName);

      return routerStates;
    }, { ...this.getState() });

    // call observers of all routers that have had state changes
    hasUpdatedTracker.forEach((routerName) => {
      const observers = this.observers[routerName] || [];
      if (Array.isArray(observers)) {
        observers.forEach(fn => fn(this.store[routerName]));
      }
    });
  }

  /**
   * Returns a function which has a router name in closure scope.
   * The returned function is used for getting the router store state for a specific router.
   */
  public createRouterStateGetter(routerName: string) {
    return () => this.store[routerName];
  }

  /**
   * Returns a function which as the router name in closure scope.
   * The returned function is used subscribe observers to changes in
   *   a single routers state.
   */
  public createRouterStateSubscriber(routerName: string) {
    if (!this.observers[routerName]) {
      this.observers[routerName] = [];
    }
    return (fn: Observer) => {
      if (Array.isArray(this.observers[routerName])) {
        this.observers[routerName].push(fn);
      } else {
        this.observers[routerName] = [fn];
      }
    };
  }

  public createRouterStateUnsubscriber(routerName: string) {
    return (fn: Observer) => {
      if (!this.observers[routerName]) {
        // TODO add to logger
        // console.warn('No subscribers present to unscribe from store');
        return;
      }
      const observers = this.observers[routerName];
      this.observers[routerName] = observers.filter(presentObservers => presentObservers !== fn);
    };
  }

  public unsubscribeAllObserversForRouter(routerName: string) {
    if (!this.observers[routerName]) {
      // TODO add to logger
      // console.warn('No subscribers present to unscribe from store');
      return;
    }
    delete this.observers[routerName];
  }

  /**
   * Returns the stores state for all routers
   */
  public getState() { return this.store; }
}
