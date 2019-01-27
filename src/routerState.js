export const defaultStore = {};

export default class DefaultRoutersStateAdapter {
  constructor(store, config = { historySize: 2 }) {
    this.store = store || defaultStore;
    // this.observers = [];
    this.config = config;
  }

  setState(desiredRouterStates) {
    const routerNames = Object.keys(desiredRouterStates);
    this.store = routerNames.reduce((routerStates, routerName) => {
      // extract current and historical states
      const { current, historical } = routerStates[routerName] || { current: {}, historical: [] };
      // clone historical states
      let newHistorical = historical.slice();
      // add current to historical states
      newHistorical.unshift(current);
      // enforce history size
      if (newHistorical.length > this.config.historySize) { newHistorical = newHistorical.slice(0, this.config.historySize); }
      // update state to include new router state
      routerStates[routerName] = { current: desiredRouterStates[routerName], historical: newHistorical }
      return routerStates;
    }, Object.assign(this.getState()));
  }

  getState() { return this.store; }
}
