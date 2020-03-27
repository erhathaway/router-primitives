import {
    RouterCurrentState,
    RouterStateObserver,
    RouterStateStoreStore,
    IRouterCurrentAndHistoricalState
} from '../types';

/**
 * The interface that all router state stores must implement.
 * This store keeps track of each routers state which is derived from the current location.
 * The store can be swapped out in the manager with other stores.
 * For example, a redux store could be used to manage state with redux, or a local storage store could be used to persist state to the client.
 */
export interface IRouterStateStore<CustomState> {
    /**
     * Sets the state of the router state store by adding to the history.
     * Adding state will completely overwrite existing state.
     * If the new state contains routers whose state is identical to old state
     *   the router callbacks won't be called for this router. Otherwise, if the state
     *   has changed, in any way, a callback will be fired off for the router(s) whose state has changed.
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
     * Returns a function with the router name in closure scope.
     * The returned function is used subscribe observers to changes in
     *   a single routers state.
     */
    createRouterStateSubscriber: (routerName: string) => RouterStateObserver<CustomState>;

    /**
     * Returns a function which has a router name in closure scope.
     * The returned function, when called, will unsubscribe all observers for the given router.
     */
    createRouterStateUnsubscriber: (routerName: string) => RouterStateObserver<CustomState>;

    /**
     * Unsubscribes all state observers for a particular router.
     */
    unsubscribeAllObserversForRouter: (routerName: string) => void;

    /**
     * Returns the store's state for all routers
     */
    getState: () => RouterStateStoreStore<CustomState>;
}
