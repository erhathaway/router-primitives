import deserializer from './deserializer';
import serializer from './serializer';
import { OutputLocation, InputLocation } from '../types/index';
declare type BrowserStoreConfig = {
    serializer: typeof serializer;
    deserializer: typeof deserializer;
};
declare type State = ReturnType<typeof deserializer>;
declare type StateObserver = (state: State) => any;
/**
 * The store that the router manager uses to write and read from the serialized state
 * The serialized state store is what, on the web, holds the URL - aka the serilaized state of the router tree
 * The default serialized state is the URL for this store
 */
export default class BrowserStore {
    observers: StateObserver[];
    config: BrowserStoreConfig;
    state: string;
    existingLocation: string;
    stateWatcher: ReturnType<typeof window.setInterval>;
    constructor(state?: string, config?: BrowserStoreConfig);
    _monitorLocation(): void;
    setState(unserializedLocation: InputLocation): void;
    notifyObservers(): void;
    getState(): OutputLocation;
    subscribeToStateChanges(fn: StateObserver): void;
    back(): void;
    forward(): void;
    go(historyChange: number): void;
}
export {};
