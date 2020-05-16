import deserializer from './deserializer';
import serializer from './serializer';
import {IOutputLocation, IInputLocation, StateObserver, SubscriptionDisposer} from '../types';
import {
    ISerializedStateStore,
    SerializedStateSerializer,
    SerializedStateDeserializer,
    ISerializedStateStoreConfig
} from '../types/serialized_state';

/**
 * The store that the router manager uses to write and read from the serialized state
 * The serialized state store is what, on the web, holds the URL - aka the serialized state of the router tree
 * The default serialized state is the URL for this store
 */
export default class BrowserStore implements ISerializedStateStore {
    public kind: 'browser' = 'browser';
    public serializer: SerializedStateSerializer;
    public deserializer: SerializedStateDeserializer;
    private observers: StateObserver[];
    private existingLocation: string | undefined;
    private stateWatcher: ReturnType<typeof window.setInterval>;

    constructor(config?: ISerializedStateStoreConfig) {
        this.observers = [];
        this.serializer = (config && config.serializer) || serializer;
        this.deserializer = (config && config.deserializer) || deserializer;

        // subscribe to location changes
        // this.existingLocation = '';
        this.stateWatcher = global.setInterval(() => {
            this._monitorLocation();
        }, 100);
        this._monitorLocation();
    }

    public cleanUp = (): void => {
        global.clearInterval(this.stateWatcher);
        this.stateWatcher = undefined;
    };

    // unserialized state = { pathname: [], search: {}, options: {} }
    // options = { updateHistory }
    public setState(unserializedLocation: IInputLocation): void {
        if (
            !window ||
            !window.history ||
            !window.history.replaceState ||
            !window.history.pushState
        ) {
            throw new Error(
                'Could not find window.history.replaceState or window.history.pushState. Consider using the memory store instead of the browser store.'
            );
        }

        const oldUnserializedLocation = this.getState();
        const {location: newState} = this.serializer(unserializedLocation, oldUnserializedLocation);

        if (unserializedLocation.options && unserializedLocation.options.replaceLocation === true) {
            window.history.replaceState({url: newState}, '', newState);
        } else {
            window.history.pushState({url: newState}, '', newState);
        }

        // no need to notify observers, b/c we are observing the URL
        // and will notify observers when that changes
        // this.notifyObservers();
    }

    public getState(): IOutputLocation {
        const searchString = window.location.search || '';
        const pathnameString = window.location.pathname || '';
        return this.deserializer(pathnameString + searchString);
    }

    public subscribeToStateChanges(fn: StateObserver): SubscriptionDisposer {
        this.observers.push(fn);

        // send existing state to observer
        const deserializedState = this.getState();
        fn(deserializedState);
        return () => {
            this.observers = this.observers.filter(o => o !== fn);
        };
    }

    // public unsubscribeFromStateChanges(fn: StateObserver): void {
    //     this.observers = this.observers.filter(existingFn => existingFn !== fn);
    // }

    public back(): void {
        if (!window || !window.history || !window.history.back) {
            throw new Error(
                'Could not find window.history.back. Consider using the memory store instead of the browser store.'
            );
        }
        window.history.back();
    }

    public forward(): void {
        if (!window || !window.history || !window.history.forward) {
            throw new Error(
                'Could not find window.history.forward. Consider using the memory store instead of the browser store.'
            );
        }
        window.history.forward();
    }

    public go(historyChange: number): void {
        if (!window || !window.history || !window.history.go) {
            throw new Error(
                'Could not find window.history.go. Consider using the memory store instead of the browser store.'
            );
        }

        window.history.go(historyChange);
    }

    private _monitorLocation(): void {
        if (!window) {
            throw new Error('window object not found. Wrong environment');
        }
        const newLocation = window.location.href;
        if (this.existingLocation !== newLocation) {
            this.existingLocation = newLocation;
            this.notifyObservers();
        }
    }

    private notifyObservers(): void {
        const deserializedState = this.getState();
        this.observers.forEach(fn => fn(deserializedState));
    }
}
