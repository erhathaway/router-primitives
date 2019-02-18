import deserializer from './deserializer';
import serializer from './serializer';
import { InputLocation } from '../types';
declare type NativeStoreConfig = {
    serializer: typeof serializer;
    deserializer: typeof deserializer;
    historySize: number;
};
declare type State = ReturnType<typeof deserializer>;
declare type StateObserver = (state: State) => any;
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
    state?: string;
    history: string[];
    currentLocationInHistory: number;
    constructor(state?: string, config?: NativeStoreConfig);
    setState(unserializedLocation: InputLocation, options?: setStateOptions): void;
    getState(): import("../types").OutputLocation;
    subscribeToStateChanges(fn: StateObserver): void;
    notifyObservers(): void;
    back(): void;
    forward(): void;
    go(historyChange: number): void;
}
export {};
