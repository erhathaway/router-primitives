import deserializer from './deserializer';
import serializer from './serializer';

/**
 * Default serialized state store is a string
 * TODO make this platform dependent or configerable via config
 *   - If on web, use web URL
 *   - If not on web (ex react native), use string
 */
// export let defaultStore = ''; // eslint-disable-line

/**
 * The adapter that the router manager uses to write and read from the serialized state store
 * The serialized state store is what, on the web, holds the URL - aka the serilaized state of the router tree
 */
export default class DefaultSerializedStateStore {
  constructor(state = '', config) {
    // this.state = state;
    this.observers = [];
    this.config = { serializer, deserializer, historySize: 10 };
    this.history = [];
    this.currentLocationInHistory = 0;
  }

  // unserialized state = { pathname: [], search: {}, options: {} }
  // options = { updateHistory }
  setState(unserializedState, options = {}) { 
    const { location: newState, options: serializerOptions } = this.config.serializer(unserializedState);
    // this.state = newState;

    if (options.updateHistory !== false) {
      // clone history
      let newHistory = this.history.slice();
  
      // not mutating the location causes the previous location to be replaced
      // thus, there will be no history of it
      // this is useful when you use modals and other elements that dont have a concept of 'back'
      // b/c once you close a modal it shouldn't reappear if you click 'back'
      if (unserializedState.options && unserializedState.options.mutateLocation === false) {
        // remove previous location
        newHistory.shift();
      }
  
      // add current to history
      newHistory.unshift(newState.slice());
      // enforce history size
      if (newHistory.length > this.config.historySize) { newHistory = newHistory.slice(0, this.config.historySize); }
      // set history
      this.history = newHistory;
    }

    const deserializedState = this.getState();
    this.observers.forEach(fn => fn(deserializedState));
  }

  getState() { return this.config.deserializer(this.history[this.currentLocationInHistory]); }

  subscribeToStateChanges(fn) { this.observers.push(fn); }

  back() {
    if (this.currentLocationInHistory === 0) { return; }
    if (this.currentLocationInHistory > 0) { this.currentLocationInHistory -= 1; }
    this.setState(this.getState(), { updateHistory: false });
  }
  forward() {
    if (this.currentLocationInHistory === 0) { return; }
    if (this.currentLocationInHistory > 0) { this.currentLocationInHistory -= 1; }
    this.setState(this.getState(), { updateHistory: false });
  }
}