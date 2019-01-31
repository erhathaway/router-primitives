import deserializer from './deserializer';
import serializer from './serializer';

/**
 * The store that the router manager uses to write and read from the serialized state
 * The serialized state store is what, on the web, holds the URL - aka the serilaized state of the router tree
 * The default serialized state is the URL for this store
 */
export default class BrowserStore {
  constructor(state = '', config) {
    this.observers = [];
    this.config = { serializer, deserializer };

    // subscribe to location changes
    this.existingLocation = '';
    this.stateWatcher = window.setInterval(() => {
      this._monitorLocation();
    }, 100);
  }

  _monitorLocation() {
    const newLocation = (window.location.href);
    if (this.existingLocation !== newLocation) {
      this.existingLocation = newLocation;
      this.notifyObservers();
    }
  }

  // unserialized state = { pathname: [], search: {}, options: {} }
  // options = { updateHistory }
  setState(unserializedLocation) {
    const oldUnserializedLocation = this.getState();
    const { location: newState } = this.config.serializer(unserializedLocation, oldUnserializedLocation);

    if (unserializedLocation.options && unserializedLocation.options.replaceLocation === true) {
      window.history.replaceState({ url: newState }, '', newState);
    } else {
      window.history.pushState({ url: newState }, '', newState);
    }

    this.notifyObservers();
  }

  notifyObservers() {
    const deserializedState = this.getState();
    this.observers.forEach(fn => fn(deserializedState));
  }

  getState() { 
    const searchString = window.location.search || '';
    const pathnameString = window.location.pathname || '';
    return this.config.deserializer(pathnameString + searchString)
  }

  subscribeToStateChanges(fn) { this.observers.push(fn); }

  back() {
    window.history.back();
  }

  forward() {
    window.history.forward();
  }

  go(historyChange) {
    window.history.go(historyChange);
  } 
}