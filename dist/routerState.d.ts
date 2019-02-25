import { IRouterState, IRouterCurrentState } from "./types";
interface IStore {
    [key: string]: IRouterState;
}
interface IConfig {
    historySize: number;
}
declare type Observer = (state: IRouterState) => any;
export default class DefaultRoutersStateStore {
    private store;
    private config;
    private observers;
    constructor(store?: IStore, config?: IConfig);
    setState(desiredRouterStates: {
        [key: string]: IRouterCurrentState;
    }): void;
    createRouterStateGetter(routerName: string): () => {};
    createRouterStateSubscriber(routerName: string): (fn: Observer) => void;
    createRouterStateUnsubscriber(routerName: string): (fn: Observer) => void;
    unsubscribeAllObserversForRouter(routerName: string): void;
    getState(): IStore;
}
export {};
