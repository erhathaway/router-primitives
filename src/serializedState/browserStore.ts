import deserializer from './deserializer';
import serializer from './serializer';
import { OutputLocation, InputLocation } from '../types/index';

type BrowserStoreConfig = {
  serializer: typeof serializer,
  deserializer: typeof deserializer,
}
type State = ReturnType<typeof deserializer>;
type StateObserver = (state: State) => any;

/**
 * The store that the router manager uses to write and read from the serialized state
 * The serialized state store is what, on the web, holds the URL - aka the serilaized state of the router tree
 * The default serialized state is the URL for this store
 */
export default class BrowserStore {
  observers: StateObserver[]
  config: BrowserStoreConfig
  state: string; // TODO remove state
  existingLocation: string;
  stateWatcher: ReturnType<typeof window.setInterval>

  constructor(state?: string, config?: BrowserStoreConfig) {
    this.observers = [];
    this.config = config || { serializer, deserializer };

    // TODO remove this and delete state param in constructor once tests are rewritten in TS
    this.state = state;

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
  setState(unserializedLocation: InputLocation) {
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

  getState(): OutputLocation {
    const searchString = window.location.search || '';
    const pathnameString = window.location.pathname || '';
    return this.config.deserializer(pathnameString + searchString);
  }

  subscribeToStateChanges(fn: StateObserver) { this.observers.push(fn); }

  back() {
    window.history.back();
  }

  forward() {
    window.history.forward();
  }

  go(historyChange: number) {
    window.history.go(historyChange);
  }
}
