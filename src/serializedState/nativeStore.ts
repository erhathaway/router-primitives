import deserializer from './deserializer';
import serializer from './serializer';
import { InputLocation } from '../types';

type NativeStoreConfig = {
  serializer: typeof serializer,
  deserializer: typeof deserializer,
  historySize: number,
}
type State = ReturnType<typeof deserializer>;
type StateObserver = (state: State) => any;
interface setStateOptions {
  updateHistory?: boolean;
}
/**
 * The store that the router manager uses to write and read from the serialized state
 * The serialized state store is what, on the web, holds the URL - aka the serilaized state of the router tree
 * For non web, or when manager.config.serializedStateStore === 'native' this store is used
 * The default serialized state is a string for this store
 */
export default class NativeStore {
  observers: StateObserver[];
  config: NativeStoreConfig;
  state?: string; // TODO remove state
  history: string[];
  currentLocationInHistory: number;

  constructor(state?: string, config?: NativeStoreConfig) {
    this.observers = [];
    this.config = config || { serializer, deserializer, historySize: 10 };
    this.history = [];
    this.currentLocationInHistory = 0;

    // TODO remove once tests are ported over to TS
    this.state = state;
  }

  // unserialized state = { pathname: [], search: {}, options: {} }
  // options = { updateHistory }
  setState(unserializedLocation: InputLocation, options: setStateOptions = {}) {
    const oldUnserializedLocation = this.getState();
    const { location: newState } = this.config.serializer(unserializedLocation, oldUnserializedLocation);

    if (options.updateHistory !== false) {
      // clone history
      let newHistory = this.history.slice();

      // not mutating the location causes the previous location to be replaced
      // thus, there will be no history of it
      // this is useful when you use modals and other elements that dont have a concept of 'back'
      // b/c once you close a modal it shouldn't reappear if you click 'back'
      if (unserializedLocation.options && unserializedLocation.options.replaceLocation === true) {
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

    this.notifyObservers();
  }

  getState() { return this.config.deserializer(this.history[this.currentLocationInHistory]); }

  subscribeToStateChanges(fn: StateObserver) { this.observers.push(fn); }

  // unsubscribeToStateChanges // TODO fill me in!

  notifyObservers() {
    const deserializedState = this.getState();
    this.observers.forEach(fn => fn(deserializedState));
  }

  back() {
    this.go(-1);
  }

  forward() {
    this.go(1);
  }

  go(historyChange: number) {
    if (historyChange === 0) { throw new Error('No history size change specified'); }

    // calcuate request history location
    const newLocation = this.currentLocationInHistory - historyChange;

    // if within the range of recorded history, set as the new history location
    if (newLocation + 1 <= this.history.length && newLocation >= 0) {
      this.currentLocationInHistory = newLocation;

    // if too far in the future, set as the most recent history
    } else if (newLocation + 1 <= this.history.length) {
      this.currentLocationInHistory = 0;

    // if too far in the past, set as the last recorded history
    } else if (newLocation >= 0) {
      this.currentLocationInHistory = this.history.length - 1;
    }

    this.setState(this.getState(), { updateHistory: false });
  }
}
