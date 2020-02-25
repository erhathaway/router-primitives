import deserializer from './deserializer';
import serializer from './serializer';
import { IInputLocation, IOutputLocation, StateObserver } from '../types';
import {
    ISerializedStateStore,
    SerializedStateSerializer,
    SerializedStateDeserializer
} from '../types/serialized_state';

interface INativeStoreConfig {
    serializer: SerializedStateSerializer;
    deserializer: SerializedStateDeserializer;
    historySize: number;
}

interface ISetStateOptions {
    updateHistory?: boolean;
}

/**
 * The store that the router manager uses to write and read from the serialized state
 * The serialized state store is what, on the web, holds the URL - aka the serilaized state of the router tree
 * For non web, or when manager.config.serializedStateStore === 'native' this store is used
 * The default serialized state is a string for this store
 */
export default class NativeStore implements ISerializedStateStore {
    public history: string[];
    private observers: StateObserver[];
    private config: INativeStoreConfig;
    private currentLocationInHistory: number;

    constructor(config?: INativeStoreConfig) {
        this.observers = [];
        this.config = config || { serializer, deserializer, historySize: 10 };
        this.history = [];
        this.currentLocationInHistory = 0;
    }

    // unserialized state = { pathname: [], search: {}, options: {} }
    // options = { updateHistory }
    public setState(unserializedLocation: IInputLocation, options: ISetStateOptions = {}): void {
        const oldUnserializedLocation = this.getState();
        const { location: newState } = this.config.serializer(
            unserializedLocation,
            oldUnserializedLocation
        );

        // console.log('*****', unserializedLocation, newState)
        if (options.updateHistory !== false) {
            // clone history
            let newHistory = this.history.slice();

            // not mutating the location causes the previous location to be replaced
            // thus, there will be no history of it
            // this is useful when you use modals and other elements that dont have a concept of 'back'
            // b/c once you close a modal it shouldn't reappear if you click 'back'
            if (
                unserializedLocation.options &&
                unserializedLocation.options.replaceLocation === true
            ) {
                // remove previous location
                newHistory.shift();
            }

            // add current to history
            newHistory.unshift(newState.slice());
            // enforce history size
            if (newHistory.length > this.config.historySize) {
                newHistory = newHistory.slice(0, this.config.historySize);
            }
            // set history
            this.history = newHistory;
        }

        this.notifyObservers();
    }

    public getState(): IOutputLocation {
        return this.config.deserializer(this.history[this.currentLocationInHistory]);
    }

    // is a BehaviorSubject
    public subscribeToStateChanges(fn: StateObserver): void {
        this.observers.push(fn);

        // send existing state to observer
        const deserializedState = this.getState();
        fn(deserializedState);
    }

    public unsubscribeFromStateChanges(fn: StateObserver): void {
        this.observers = this.observers.filter(existingFn => existingFn !== fn);
    }
    // unsubscribeToStateChanges // TODO fill me in!

    public back(): void {
        this.go(-1);
    }

    public forward(): void {
        this.go(1);
    }

    public go(historyChange: number): void {
        if (historyChange === 0) {
            throw new Error('No history size change specified');
        }

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

    private notifyObservers(): void {
        const deserializedState = this.getState();
        this.observers.forEach(fn => fn(deserializedState));
    }
}
