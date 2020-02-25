import {
    RouterCurrentState,
    RouterStateObserver,
    RouterStateStoreStore,
    IRouterCurrentAndHistoricalState
} from '../types';

/**
 * The default router state store.
 * This store keeps track of each routers state which is derived from the current location
 * This store can be swaped out in the manager with other stores.
 * For example, a redux store could be used to manage state with redux, or a local storage store could be used to persist state to the client.
 * Stores must implement the methods:
 *   setState
 *   getState
 *   createRouterStateGetter
 *   createRouterStateSubscriber
 */
export interface IRouterStateStore<CustomState extends {}> {
    // store: RouterStateStoreStore<CustomState>
    /**
     * Sets the state of the router state store by adding to the history.
     * Adding state will completly overwrite existing state.
     * If the new contains routers whose state is identical to old state
     *   the router callbacks wont be called for this router. Otherwise, if the state
     *   has changed in any way, callback will be fired off for the router.
     */
    setState: (desiredRouterStates: Record<string, RouterCurrentState<CustomState>>) => void;

    /**
     * Returns a function which has a router name in closure scope.
     * The returned function is used for getting the router store state for a specific router.
     */
    createRouterStateGetter: (
        routerName: string
    ) => () => IRouterCurrentAndHistoricalState<CustomState>;

    /**
     * Returns a function which as the router name in closure scope.
     * The returned function is used subscribe observers to changes in
     *   a single routers state.
     */
    createRouterStateSubscriber: (routerName: string) => RouterStateObserver<CustomState>;

    createRouterStateUnsubscriber: (routerName: string) => RouterStateObserver<CustomState>;

    unsubscribeAllObserversForRouter: (routerName: string) => void;

    /**
     * Returns the stores state for all routers
     */
    getState: () => RouterStateStoreStore<CustomState>;
}
