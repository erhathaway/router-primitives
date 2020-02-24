import {IOutputLocation, IInputLocation, StateObserver, ILocationOptions} from '../types/index';

export type SerializedStateDeserializer = (serializedLocation: string) => IOutputLocation;
export type SerializedStateSerializer = (
    newLocation: IInputLocation,
    oldLocation?: IInputLocation
) => {
    location: string;
    options: ILocationOptions;
};

interface IBrowserStoreConfig {
    serializer: SerializedStateSerializer;
    deserializer: SerializedStateDeserializer;
}

/**
 * The store that the router manager uses to write and read from the serialized state
 * The serialized state store is what, on the web, holds the URL - aka the serilaized state of the router tree
 * The default serialized state is the URL for this store
 */
export interface ISerializedStateStore {
    constructor: (config?: IBrowserStoreConfig) => ISerializedStateStore;

    // unserialized state = { pathname: [], search: {}, options: {} }
    // options = { updateHistory }
    setState: (unserializedLocation: IInputLocation) => void;

    getState: () => IOutputLocation;

    // is a BehaviorSubject
    subscribeToStateChanges: (fn: StateObserver) => void;

    unsubscribeFromStateChanges: (fn: StateObserver) => void;
    back: () => void;

    forward: () => void;

    go: (historyChange: number) => void;
}
