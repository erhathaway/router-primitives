import deserializer from './deserializer';
import serializer from './serializer';
import { IOutputLocation, IInputLocation } from '../types/index';
interface IBrowserStoreConfig {
    serializer: typeof serializer;
    deserializer: typeof deserializer;
}
declare type State = ReturnType<typeof deserializer>;
declare type StateObserver = (state: State) => any;
export default class BrowserStore {
    private observers;
    private config;
    private existingLocation;
    private stateWatcher;
    constructor(config?: IBrowserStoreConfig);
    setState(unserializedLocation: IInputLocation): void;
    getState(): IOutputLocation;
    subscribeToStateChanges(fn: StateObserver): void;
    unsubscribeFromStateChanges(fn: StateObserver): void;
    back(): void;
    forward(): void;
    go(historyChange: number): void;
    private _monitorLocation;
    private notifyObservers;
}
export {};
