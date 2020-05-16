import deserializer from './deserializer';
import serializer from './serializer';
import {IInputLocation, IOutputLocation, StateObserver, SubscriptionDisposer} from '../types';
import {
    ISerializedStateStore,
    SerializedStateSerializer,
    SerializedStateDeserializer,
    ISerializedStateStoreConfig
} from '../types/serialized_state';

interface INativeStoreConfig extends ISerializedStateStoreConfig {
    serializer: SerializedStateSerializer;
    deserializer: SerializedStateDeserializer;
    historySize: number;
}

interface ISetStateOptions {
    updateHistory?: boolean;
}

/**
 * The store that the router manager uses to write and read from the serialized state
 * The serialized state store is what, on the web, holds the URL - aka the serialized state of the router tree
 * For non web, or when manager.config.serializedStateStore === 'native' this store is used
 * The default serialized state is a string for this store
 */
export default class NativeStore implements ISerializedStateStore {
    public kind: 'memory' = 'memory';
    public serializer: SerializedStateSerializer;
    public deserializer: SerializedStateDeserializer;
    public historySize: number;
    public history: string[];
    private observers: StateObserver[];
    private currentLocationInHistory: number;

    constructor(config?: INativeStoreConfig) {
        this.observers = [];
        this.serializer = (config && config.serializer) || serializer;
        this.deserializer = (config && config.deserializer) || deserializer;
        this.historySize = (config && config.historySize) || 10;
        this.history = [];
        this.currentLocationInHistory = 0;
    }

    // unserialized state = { pathname: [], search: {}, options: {} }
    // options = { updateHistory }
    public setState(unserializedLocation: IInputLocation, options: ISetStateOptions = {}): void {
        const oldUnserializedLocation = this.getState();
        const {location: newState} = this.serializer(unserializedLocation, oldUnserializedLocation);

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
            if (newHistory.length > this.historySize) {
                newHistory = newHistory.slice(0, this.historySize);
            }
            // set history
            this.history = newHistory;
        }

        this.notifyObservers();
    }

    public getState(): IOutputLocation {
        return this.deserializer(this.history[this.currentLocationInHistory]);
    }

    // is a BehaviorSubject
    public subscribeToStateChanges(fn: StateObserver): SubscriptionDisposer {
        this.observers.push(fn);

        // send existing state to observer
        const deserializedState = this.getState();
        if (deserializedState) {
            fn(deserializedState);
        }
        return () => {
            this.observers = this.observers.filter(o => o !== fn);
        };
    }

    // public unsubscribeFromStateChanges(fn: StateObserver) {
    //     this.observers = this.observers.filter(existingFn => existingFn !== fn);

    // }

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

        // calculate request history location
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

        const existingLocation = this.getState() as IInputLocation;
        this.setState({...existingLocation}, {updateHistory: false});
    }

    private notifyObservers(): void {
        const deserializedState = this.getState();
        this.observers.forEach(fn => fn(deserializedState));
    }
}
