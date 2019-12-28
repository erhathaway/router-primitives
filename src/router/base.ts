import Cache from './cache';
import {
    IRouter,
    IRouterCurrentState,
    RouterHistoryState,
    IRouterDeclaration,
    ISerializeOptions,
    IRouterInitArgs,
    RouterAction,
    RouterReducer
} from '../types';

interface IRouterBase {
    [method: string]: any;
}

export interface IInternalState {
    [field: string]: any;
}
// export type InternalStateUpdateFn = (
//     existingInternalState: IInternalState
// ) => {
//     [field: string]: any;
// };

export default class RouterBase implements IRouterBase {
    public name: IRouterInitArgs['name'];
    public type: IRouterInitArgs['type'];
    public manager: IRouterInitArgs['manager'];
    public parent: IRouterInitArgs['parent'];
    public routers: IRouterInitArgs['routers'];
    public root: IRouterInitArgs['root'];
    public getState: IRouterInitArgs['getState'];
    public subscribe: IRouterInitArgs['subscribe'];
    public config: IRouterInitArgs['config'];
    public cache: Cache;
    public _EXPERIMENTAL_internal_state: IInternalState; // tslint:disable-line

    constructor(init: IRouterInitArgs) {
        const {
            name,
            config,
            type,
            manager,
            parent,
            routers,
            root,
            getState,
            subscribe,
            actions
        } = init;

        // required
        if (!name || !type || !manager) {
            throw new Error('Missing required kwargs: name, type, and/or manager');
        }

        this.name = name;
        this.config = config;
        this.type = type;
        this.manager = manager;

        // optional
        this.parent = parent;
        this.routers = routers || {};
        this.root = root;

        // methods customized for instance from manager
        this.getState = getState;
        this.subscribe = subscribe;

        // store the routers location data for rehydration
        this.cache = new Cache();

        this._EXPERIMENTAL_internal_state = {};

        // TODO fix test so empty array isn't needed
        // TODO add tests for this
        // Since actions come from the template and are decorated by the manager, we need to bind them
        // to the router instance where they live
        (actions || []).forEach(actionName => {
            if ((this as any)[actionName]) {
                (this as any)[actionName] = (this as any)[actionName].bind(this);
            }
        });
        // this._state = this._state.bind(this);
    }

    get lastDefinedParentsDisableChildCacheState(): boolean {
        if (!this.parent) {
            return false;
        }
        const parentState = this.parent.config.disableCaching;
        if (parentState !== undefined) {
            return parentState;
        } else {
            return this.parent.lastDefinedParentsDisableChildCacheState;
        }
    }

    get routeKey() {
        return this.config.routeKey;
    }

    get siblings() {
        return this.parent.routers[this.type].filter(r => r.name !== this.name);
    }

    public getNeighborsByType(type: string): IRouter[] {
        if (this.parent && this.parent.routers) {
            return this.parent.routers[type] || [];
        }
        return [];
    }

    public getNeighbors(): IRouter[] {
        if (!this.parent) {
            return [];
        }

        const flattened = (arr: IRouter[]) => [].concat(...arr);
        return Object.keys(this.parent.routers)
            .filter(t => t !== this.type)
            .map(t => this.parent.routers[t])
            .reduce(flattened);
    }

    get pathLocation(): number {
        if (!this.parent) {
            return -1;
        }
        return 1 + this.parent.pathLocation;
    }

    get isRootRouter() {
        return !this.parent;
    }

    // private set EXPERIMENTAL_internal_state(internalState: Object) {
    //     this._EXPERIMENTAL_internal_state = internalState; // stateUpdateFn({...this._EXPERIMENTAL_internal_state});
    // }

    public EXPERIMENTAL_setInternalState(internalState: IInternalState) {
        this._EXPERIMENTAL_internal_state = {...internalState};
    }

    public get EXPERIMENTAL_internal_state(): IInternalState {
        return this._EXPERIMENTAL_internal_state;
    }

    /**
     * Return serialized information about this router
     * and all of its children routers.
     * Useful for debugging.
     *
     * Returns a router serialization object tree
     */
    public serialize(options: ISerializeOptions = {}) {
        // create router declaration object
        const serialized: IRouterDeclaration & {[key: string]: any} = {
            name: this.name,
            routeKey: options.alwaysShowRouteKey
                ? this.routeKey
                : this.routeKey === this.name
                ? undefined
                : this.routeKey,
            type: options.showType ? this.type : undefined,
            parentName: options.showParentName && this.parent ? this.parent.name : undefined,
            isPathRouter: this.config.isPathRouter,
            disableCaching: options.showDefaults ? this.config.disableCaching : undefined,
            shouldInverselyActivate: options.showDefaults
                ? this.config.shouldInverselyActivate
                : undefined,
            defaultAction: options.showDefaults ? this.config.defaultAction : undefined
        };

        // recursively serialize child routers
        const childRouterTypes = Object.keys(this.routers);
        const childRouters = childRouterTypes.reduce(
            (acc, type) => {
                acc[type] = this.routers[type].map(childRouter => childRouter.serialize(options));
                return acc;
            },
            {} as {[routerType: string]: IRouterDeclaration[]}
        );

        if (childRouterTypes.length > 0) {
            serialized.routers = childRouters;
        }

        Object.keys(serialized).forEach(key =>
            serialized[key] === undefined ? delete serialized[key] : ''
        );

        return serialized;
    }

    get isPathRouter() {
        // If there is no parent, we are at the root.
        // The root is by default a path router since
        // it represents the '/' in a pathname location
        if (!this.parent) {
            return true;
        }
        // If this router was explicitly set to be a path router during config, return true
        if (this.config.isPathRouter && this.parent.isPathRouter) {
            return true;
        }
        // If this router is a path router but its parent isn't we need to throw an error.
        // It is impossible to construct a path if all the parents are also not path routers
        if (this.config.isPathRouter) {
            throw new Error(`${this.type} router: ${this.name} is explicitly set to modify the pathname
            	but one of its parent routers doesnt have this permission.
            	Make sure all parents have 'isPathRouter' attribute set to 'true' in the router config OR
            	Make sure all parents are of router type 'scene' or 'data'.
            	If the routers parents have siblings of both 'scene' and 'data' the 'scene' router will always be used for the pathname
              `);
        }

        return false;
    }

    get state(): IRouterCurrentState {
        return this._state();
    }

    protected _state = (): IRouterCurrentState => {
        if (!this.getState) {
            throw new Error('no getState function specified by the manager');
        }
        const {current} = this.getState();
        const newState = current || {};
        return {...newState, ...this.EXPERIMENTAL_internal_state};
    };

    public get history(): RouterHistoryState {
        return this._history();
    }

    protected _history = (): RouterHistoryState => {
        if (!this.getState) {
            throw new Error('no getState function specified by the manager');
        }
        const {historical} = this.getState();
        return historical || [];
    };
}
