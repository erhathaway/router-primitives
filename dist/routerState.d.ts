import { RouterState, RouterCurrentState } from "./types";
interface Store {
    [key: string]: RouterState;
}
interface Config {
    historySize: number;
}
declare type Observer = (state: RouterState) => any;
/**
 * The default router state store.
 * This store keeps track of each routers state which is derived from the current location
 * This store can be swaped out in the manager with other stores. For example, a redux store.
 * Stores must implement the methods:
 *   setState
 *   getState
 *   createRouterStateGetter
 *   createRouterStateSubscriber
 */
export default class DefaultRoutersStateStore {
    store: Store;
    config: Config;
    observers: {
        [key: string]: Observer[];
    };
    constructor(store?: Store, config?: Config);
    /**
     * Sets the state of the router state store by adding to the history.
     * Adding state will completly overwrite existing state.
     * If the new contains routers whose state is identical to old state
     *   the router callbacks wont be called for this router. Otherwise, if the state
     *   has changed in any way, callback will be fired off for the router.
     */
    setState(desiredRouterStates: {
        [key: string]: RouterCurrentState;
    }): void;
    /**
     * Returns a function which has a router name in closure scope.
     * The returned function is used for getting the router store state for a specific router.
     */
    createRouterStateGetter(routerName: string): () => {};
    /**
     * Returns a function which as the router name in closure scope.
     * The returned function is used subscribe observers to changes in
     *   a single routers state.
     */
    createRouterStateSubscriber(routerName: string): (fn: Observer) => void;
    /**
     * Returns the stores state for all routers
     */
    getState(): Store;
}
export {};
