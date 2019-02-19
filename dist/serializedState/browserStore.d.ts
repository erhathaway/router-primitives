import deserializer from './deserializer';
import serializer from './serializer';
import { IOutputLocation, IInputLocation } from '../types/index';
interface IBrowserStoreConfig {
    serializer: typeof serializer;
    deserializer: typeof deserializer;
}
declare type State = ReturnType<typeof deserializer>;
declare type StateObserver = (state: State) => any;
/**
 * The store that the router manager uses to write and read from the serialized state
 * The serialized state store is what, on the web, holds the URL - aka the serilaized state of the router tree
 * The default serialized state is the URL for this store
 */
export default class BrowserStore {
    private observers;
    private config;
    private existingLocation;
    private stateWatcher;
    constructor(config?: IBrowserStoreConfig);
    setState(unserializedLocation: IInputLocation): void;
    getState(): IOutputLocation;
    subscribeToStateChanges(fn: StateObserver): void;
    back(): void;
    forward(): void;
    go(historyChange: number): void;
    private _monitorLocation;
    private notifyObservers;
}
export {};
