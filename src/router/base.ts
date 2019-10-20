import Cache from './cache';
import {
    IRouter,
    IRouterCurrentState,
    RouterHistoryState,
    IRouterDeclaration,
    ISerializeOptions,
    IRouterInitArgs,
} from '../types';

export default class RouterBase {
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
        if (this.config.disableCaching === undefined) {
            this.config.disableCaching = false;
        }

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

        // TODO fix test so empty array isn't needed
        // TODO add tests for this
        // Since actions come from the template and are decorated by the manager, we need to bind them
        // to the router instance where they live
        (actions || []).forEach(actionName => {
            if ((this as any)[actionName]) {
                (this as any)[actionName] = (this as any)[actionName].bind(this);
            }
        });
    }

    get routeKey() {
        return this.config.routeKey || this.name;
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

    get pathLocation(): number {
        if (!this.parent) {
            return -1;
        }
        return 1 + this.parent.pathLocation;
    }

    get isRootRouter() {
        return !this.parent;
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
        const serialized = {
            name: this.name,
            routeKey: options.alwaysShowRouteKey
                ? this.routeKey
                : this.routeKey === this.name
                    ? undefined
                    : this.routeKey,
            disableCaching: options.showDefaults
                ? this.config.disableCaching
                : this.config.disableCaching === true
                    ? true
                    : undefined,
            isPathRouter: this.config.isPathRouter,
            type: options.showType ? this.type : undefined,
            parentName: options.showParentName && this.parent ? this.parent.name : undefined,
            defaultAction: options.showDefaults
                ? this.config.defaultAction
                : this.config.defaultAction !== undefined
                    ? this.config.defaultAction
                    : undefined
        } as IRouterDeclaration & { [key: string]: any };

        // recursively serialize child routers
        const childRouterTypes = Object.keys(this.routers);
        const childRouters = childRouterTypes.reduce(
            (acc, type) => {
                acc[type] = this.routers[type].map(childRouter => childRouter.serialize(options));
                return acc;
            },
            {} as { [routerType: string]: IRouterDeclaration[] }
        );

        if (childRouterTypes.length > 0) {
            serialized.routers = childRouters;
        }

        Object.keys(serialized).forEach(key =>
            serialized[key] === undefined ? delete serialized[key] : ''
        );

        return serialized;
    }

    // TODO Remove testing dependency - this shouldn't be used since it bypasses the manager
    // Create utility function instead to orchestrate relationships between routers
    // private _addChildRouter(router: IRouter) {
    //     if (!router.type) {
    //         throw new Error('Router is missing type');
    //     }

    //     const siblingTypes = (this.routers[router.type] || []) as IRouter[];
    //     siblingTypes.push(router);
    //     this.routers[router.type] = siblingTypes;

    //     router.parent = (this as any) as IRouter;
    // }

    get isPathRouter() {
        // if there is no parent, we are at the root. The root is by default a path router since
        // it represents the '/' in a pathname location
        if (!this.parent) {
            return true;
        }
        // if this router was explicitly set to be a path router during config, return true
        if (this.config.isPathRouter && this.parent.isPathRouter) {
            return true;
        }
        // else if this router is a path router but its parent isn't we need to throw an error.
        // it is impossible to construct a path if all the parents are also not path routers
        if (this.config.isPathRouter) {
            throw new Error(`${this.type} router: ${
                this.name
                } is explicitly set to modify the pathname
		but one of its parent routers doesnt have this permission.
		Make sure all parents have 'isPathRouter' attribute set to 'true' in the router config OR
		Make sure all parents are of router type 'scene' or 'data'.
		If the routers parents have siblings of both 'scene' and 'data' the 'scene' router will always be used for the pathname
	  `);
        }

        if (this.type === 'scene' && this.parent.isPathRouter) {
            // check to make sure neighboring data routers arent explicitly set to modify the pathname
            const neighboringDataRouters = this.getNeighborsByType('data');
            const isSiblingRouterExplictlyAPathRouter = neighboringDataRouters.reduce(
                (acc, r) =>
                    // check all data router neighbors and
                    // make sure none have been explicitly set to be a path router
                    acc || r.config.isPathRouter === true,
                false
            );
            if (isSiblingRouterExplictlyAPathRouter === false) {
                return true;
            }
        } else if (this.type === 'data' && this.parent && this.parent.isPathRouter) {
            // if the router is explictly set to not be a path router, return false
            if (this.config.isPathRouter === false) {
                return false;
            }

            // check to make sure neighboring scene routers aren't present
            const neighboringSceneRouters = this.getNeighborsByType('scene');

            return (
                neighboringSceneRouters.length === 0 &&
                !this.siblings.reduce(
                    (acc, r) =>
                        // check all data router siblings and
                        // make sure none are path routers
                        acc || r.config.isPathRouter === true,
                    false
                )
            );
        }

        return false;
    }

    get state(): IRouterCurrentState {
        if (!this.getState) {
            throw new Error('no getState function specified by the manager');
        }
        const { current } = this.getState();
        return current || {};
    }

    get history(): RouterHistoryState {
        if (!this.getState) {
            throw new Error('no getState function specified by the manager');
        }
        const { historical } = this.getState();
        return historical || [];
    }
}
