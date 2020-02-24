import deserializer from './deserializer';
import serializer from './serializer';
import {IOutputLocation, IInputLocation, StateObserver} from '../types/index';
import {
    ISerializedStateStore,
    SerializedStateSerializer,
    SerializedStateDeserializer
} from '../types/serialized_state';

interface IBrowserStoreConfig {
    serializer: SerializedStateSerializer;
    deserializer: SerializedStateDeserializer;
}

/**
 * The store that the router manager uses to write and read from the serialized state
 * The serialized state store is what, on the web, holds the URL - aka the serilaized state of the router tree
 * The default serialized state is the URL for this store
 */
export default class BrowserStore implements ISerializedStateStore {
    private observers: StateObserver[];
    private config: IBrowserStoreConfig;
    private existingLocation: string;
    private stateWatcher: ReturnType<typeof window.setInterval>;

    constructor(config?: IBrowserStoreConfig) {
        this.observers = [];
        this.config = config || {serializer, deserializer};

        // subscribe to location changes
        this.existingLocation = '';
        this.stateWatcher = global.setInterval(() => {
            this._monitorLocation();
        }, 100);
    }

    // unserialized state = { pathname: [], search: {}, options: {} }
    // options = { updateHistory }
    public setState(unserializedLocation: IInputLocation): void {
        const oldUnserializedLocation = this.getState();
        const {location: newState} = this.config.serializer(
            unserializedLocation,
            oldUnserializedLocation
        );

        if (unserializedLocation.options && unserializedLocation.options.replaceLocation === true) {
            window.history.replaceState({url: newState}, '', newState);
        } else {
            window.history.pushState({url: newState}, '', newState);
        }

        this.notifyObservers();
    }

    public getState(): IOutputLocation {
        const searchString = window.location.search || '';
        const pathnameString = window.location.pathname || '';
        return this.config.deserializer(pathnameString + searchString);
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

    public back(): void {
        window.history.back();
    }

    public forward(): void {
        window.history.forward();
    }

    public go(historyChange: number): void {
        window.history.go(historyChange);
    }

    private _monitorLocation(): void {
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
