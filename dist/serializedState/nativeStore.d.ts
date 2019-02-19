import deserializer from './deserializer';
import serializer from './serializer';
import { IInputLocation } from '../types';
interface INativeStoreConfig {
    serializer: typeof serializer;
    deserializer: typeof deserializer;
    historySize: number;
}
declare type State = ReturnType<typeof deserializer>;
declare type StateObserver = (state: State) => any;
interface ISetStateOptions {
    updateHistory?: boolean;
}
/**
 * The store that the router manager uses to write and read from the serialized state
 * The serialized state store is what, on the web, holds the URL - aka the serilaized state of the router tree
 * For non web, or when manager.config.serializedStateStore === 'native' this store is used
 * The default serialized state is a string for this store
 */
export default class NativeStore {
    history: string[];
    private observers;
    private config;
    private currentLocationInHistory;
    constructor(config?: INativeStoreConfig);
    setState(unserializedLocation: IInputLocation, options?: ISetStateOptions): void;
    getState(): import("../types").IOutputLocation;
    subscribeToStateChanges(fn: StateObserver): void;
    back(): void;
    forward(): void;
    go(historyChange: number): void;
    private notifyObservers;
}
export {};
