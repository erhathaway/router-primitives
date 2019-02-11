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
  constructor(store, config = { historySize: 2 }) {
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
  setState(desiredRouterStates) {
    const routerNames = Object.keys(desiredRouterStates);
    // Keeps track of which routers have new state. 
    // Used to notify observers of new state changes on a router by router level
    const hasUpdatedTracker = [];

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
    }, Object.assign(this.getState()));

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
  createRouterStateGetter(routerName) {
    return () => this.store[routerName] || {};
  }

  /**
   * Returns a function which as the router name in closure scope.
   * The returned function is used subscribe observers to changes in 
   *   a single routers state.
   */
  createRouterStateSubscriber(routerName) {
    return (fn) => {
      if (Array.isArray(this.observers[routerName])) {
        this.observers[routerName].push(fn);
      } else {
        this.observers[routerName] = [fn];
      }
    };
  }

  /**
   * Returns the stores state for all routers
   */
  getState() { return this.store; }
}
