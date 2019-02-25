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
export default class NativeStore {
    history: string[];
    private observers;
    private config;
    private currentLocationInHistory;
    constructor(config?: INativeStoreConfig);
    setState(unserializedLocation: IInputLocation, options?: ISetStateOptions): void;
    getState(): import("../types").IOutputLocation;
    subscribeToStateChanges(fn: StateObserver): void;
    unsubscribeFromStateChanges(fn: StateObserver): void;
    back(): void;
    forward(): void;
    go(historyChange: number): void;
    private notifyObservers;
}
export {};
