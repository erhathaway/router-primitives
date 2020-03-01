import {
    Observer,
    RouterCurrentState,
    IRouterCurrentAndHistoricalState,
    RouterStateObserver,
    RouterStateObservers,
    IRouterStateStoreConfig,
    RouterStateStoreStore
} from './types';
import {IRouterStateStore} from './types/router_state';
import {objKeys} from './utilities';

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
export default class DefaultRoutersStateStore<CustomState extends {}>
    implements IRouterStateStore<CustomState> {
    private store: RouterStateStoreStore<CustomState>;
    private config: IRouterStateStoreConfig;
    private observers: RouterStateObservers<CustomState>;

    constructor(store?: RouterStateStoreStore<CustomState>, config?: IRouterStateStoreConfig) {
        this.store = store || {};
        this.config = {historySize: 2, ...config};
        this.observers = {}; // key is routerName
    }

    /**
     * Sets the state of the router state store by adding to the history.
     * Adding state will completly overwrite existing state.
     * If the new contains routers whose state is identical to old state
     *   the router callbacks wont be called for this router. Otherwise, if the state
     *   has changed in any way, callback will be fired off for the router.
     */
    public setState(desiredRouterStates: Record<string, RouterCurrentState<CustomState>>): void {
        const routerNames = objKeys(desiredRouterStates);
        // Keeps track of which routers have new state.
        // Used to notify observers of new state changes on a router by router level
        const hasUpdatedTracker = [] as string[];

        this.store = routerNames.reduce(
            (routerStates, routerName) => {
                // extract current and historical states
                const {current: prevCurrent, historical} =
                    routerStates[routerName] ||
                    ({
                        current: {},
                        historical: []
                    } as IRouterCurrentAndHistoricalState<CustomState>);
                const newCurrent = desiredRouterStates[routerName];

                // skip routers who haven't been updated
                // TODO test performance of this JSON.stringify comparison
                if (JSON.stringify(newCurrent) === JSON.stringify(prevCurrent)) {
                    return routerStates;
                }

                // clone historical states
                let newHistorical = historical.slice();

                // check to make sure there is state to record into history
                if (objKeys(prevCurrent).length > 0) {
                    // add current to historical states
                    newHistorical.unshift(prevCurrent);
                }

                // enforce history size
                if (newHistorical.length > this.config.historySize) {
                    newHistorical = newHistorical.slice(0, this.config.historySize);
                }
                // update state to include new router state
                routerStates[routerName] = {current: newCurrent, historical: newHistorical};

                // record which routers have had a state change
                hasUpdatedTracker.push(routerName);

                return routerStates;
            },
            {...this.getState()}
        );

        // call observers of all routers that have had state changes
        hasUpdatedTracker.forEach(routerName => {
            const observers = this.observers[routerName] || [];
            if (Array.isArray(observers)) {
                observers.forEach(fn => fn(this.store[routerName]));
            }
        });
    }

    /**
     * Returns a function which has a router name in closure scope.
     * The returned function is used for getting the router store state for a specific router.
     */
    public createRouterStateGetter(
        routerName: string
    ): () => IRouterCurrentAndHistoricalState<CustomState> {
        return () => this.store[routerName];
    }

    /**
     * Returns a function which as the router name in closure scope.
     * The returned function is used subscribe observers to changes in
     *   a single routers state.
     */
    public createRouterStateSubscriber(routerName: string): RouterStateObserver<CustomState> {
        if (!this.observers[routerName]) {
            this.observers[routerName] = [];
        }
        return (fn: Observer<CustomState>) => {
            if (Array.isArray(this.observers[routerName])) {
                this.observers[routerName].push(fn);
            } else {
                this.observers[routerName] = [fn];
            }
        };
    }

    public createRouterStateUnsubscriber(routerName: string): RouterStateObserver<CustomState> {
        return (fn: Observer<CustomState>) => {
            if (!this.observers[routerName]) {
                // TODO add to logger
                // console.warn('No subscribers present to unscribe from store');
                return;
            }
            const observers = this.observers[routerName];
            this.observers[routerName] = observers.filter(
                // TODO validate that this works
                presentObservers => presentObservers !== fn
            );
        };
    }

    public unsubscribeAllObserversForRouter(routerName: string): void {
        if (!this.observers[routerName]) {
            // TODO add to logger
            // console.warn('No subscribers present to unscribe from store');
            return;
        }
        delete this.observers[routerName];
    }

    /**
     * Returns the stores state for all routers
     */
    public getState(): RouterStateStoreStore<CustomState> {
        return this.store;
    }
}