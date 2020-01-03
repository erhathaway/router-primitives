import Cache from './cache';
import {
    IRouterDeclaration,
    ISerializeOptions,
    IRouterInitArgs,
    RouterInstance,
    ExtractCustomStateFromTemplate,
    RouterCurrentState,
    RouterHistoricalState,
    IRouterTemplates,
    NeighborsOfType,
    NarrowRouterTypeName
} from '../types';

export interface IInternalState {
    isActive?: boolean;
}

export default class RouterBase<
    Templates extends IRouterTemplates,
    RouterTypeName extends NarrowRouterTypeName<keyof Templates>,
    InitArgs extends IRouterInitArgs<Templates, RouterTypeName> = IRouterInitArgs<
        Templates,
        RouterTypeName
    >
> {
    public name: InitArgs['name'];
    public type: InitArgs['type'];
    public manager: InitArgs['manager'];
    public parent?: InitArgs['parent'];
    public routers: InitArgs['routers'];
    public root: InitArgs['root'];
    public getState?: InitArgs['getState'];
    public subscribe?: InitArgs['subscribe'];
    public config: InitArgs['config'];
    public cache: Cache<Templates, RouterTypeName>;
    public _EXPERIMENTAL_internal_state: IInternalState; // eslint-disable-line

    constructor(init: InitArgs) {
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
            actions,
            cache: CustomCacheClass
        } = init;

        // required
        if (!name || !type || !manager || !config) {
            throw new Error('Missing required kwargs: name, type, config, and/or manager');
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
        const CacheClass = CustomCacheClass || Cache;
        this.cache = new CacheClass();

        this._EXPERIMENTAL_internal_state = {}; // eslint-disable-line

        // TODO fix test so empty array isn't needed
        // TODO add tests for this
        // Since actions come from the template and are decorated by the manager, we need to bind them
        // to the router instance where they live
        (actions || []).forEach(actionName => {
            // eslint-disable-next-line
            if ((this as any)[actionName]) {
                // eslint-disable-next-line
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

    get routeKey(): string {
        return this.config.routeKey;
    }

    get siblings(): RouterInstance<Templates, RouterTypeName>[] {
        // TODO fix this any
        // eslint-disable-next-line
        return (this.parent.routers as Record<string, any[]>)[this.type].filter(
            r => r.name !== this.name
        );
    }

    /**
     * Returns all neighbors of a certain router type. This could include the same router type of this router if desired.
     */
    public getNeighborsByType<DesiredType extends NarrowRouterTypeName<keyof Templates>>(
        type: DesiredType
    ): Array<RouterInstance<Templates, DesiredType>> {
        if (this.parent && this.parent.routers) {
            // TODO fix this any
            // eslint-disable-next-line
            return (this.parent.routers as Record<string, any[]>)[type] || [];
        }
        return [];
    }

    /**
     * Returns all neighboring routers. That is, all routers that have the same parent but are not of this router type.
     */
    public getNeighbors(): NeighborsOfType<
        Templates,
        NarrowRouterTypeName<Exclude<keyof Templates, RouterTypeName>>
    > {
        if (!this.parent) {
            return [];
        }

        // eslint-disable-next-line
        const flattened = (acc: any[], arr: any[]): any[] => acc.concat(...arr);

        return Object.keys(this.parent.routers)
            .filter(t => t !== this.type)
            .map(t => this.parent.routers[t])
            .reduce(flattened, []);
    }

    get pathLocation(): number {
        if (!this.parent) {
            return -1;
        }
        return 1 + this.parent.pathLocation;
    }

    get isRootRouter(): boolean {
        return !this.parent;
    }

    // private set EXPERIMENTAL_internal_state(internalState: Object) {
    //     this._EXPERIMENTAL_internal_state = internalState; // stateUpdateFn({...this._EXPERIMENTAL_internal_state});
    // }

    // eslint-disable-next-line
    public EXPERIMENTAL_setInternalState(internalState: IInternalState): void {
        this._EXPERIMENTAL_internal_state = {...internalState}; // eslint-disable-line
    }

    // eslint-disable-next-line
    public get EXPERIMENTAL_internal_state(): IInternalState {
        // eslint-disable-next-line
        return this._EXPERIMENTAL_internal_state;
    }

    /**
     * Return serialized information about this router
     * and all of its children routers.
     * Useful for debugging.
     *
     * Returns a router serialization object tree
     */
    public serialize(
        options: ISerializeOptions = {}
        // eslint-disable-next-line
    ): IRouterDeclaration<Templates> & {[key: string]: any} {
        // create router declaration object
        // TODO clean up this mess
        // eslint-disable-next-line
        const serialized: IRouterDeclaration<Templates> & {[key: string]: any} = {
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
                // eslint-disable-next-line
                (acc as any)[type] = this.routers[type].map(childRouter =>
                    childRouter.serialize(options)
                );
                return acc;
            },
            {} as {[routerType: string]: IRouterDeclaration<Templates>[]}
        );

        if (childRouterTypes.length > 0) {
            serialized.routers = childRouters;
        }

        Object.keys(serialized).forEach(key =>
            serialized[key] === undefined ? delete serialized[key] : ''
        );

        return serialized;
    }

    get isPathRouter(): boolean {
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

    get state(): RouterCurrentState<ExtractCustomStateFromTemplate<Templates[RouterTypeName]>> {
        return this._state();
    }

    protected _state = (): RouterCurrentState<
        ExtractCustomStateFromTemplate<Templates[RouterTypeName]>
    > & {isActive?: boolean} => {
        if (!this.getState) {
            throw new Error('no getState function specified by the manager');
        }
        const {current} = this.getState();
        const newState = current || {};
        return {...newState, ...this.EXPERIMENTAL_internal_state} as RouterCurrentState<
            ExtractCustomStateFromTemplate<Templates[RouterTypeName]>
        > & {isActive?: boolean};
    };

    public get history(): RouterHistoricalState<
        ExtractCustomStateFromTemplate<Templates[RouterTypeName]>
    > {
        return this._history();
    }

    protected _history = (): RouterHistoricalState<
        ExtractCustomStateFromTemplate<Templates[RouterTypeName]>
    > => {
        if (!this.getState) {
            throw new Error('no getState function specified by the manager');
        }
        const {historical} = this.getState();
        return historical || [];
    };
}

// const managerTest = new Manager();
// const baseTest = new RouterBase<typeof template, 'scene'>({} as any); // eslint-disable-line

// baseTest.routers['stack'];
// baseTest.parent.routers['stack'];
// baseTest.root.routers['stack'];
// const nbt = baseTest.getNeighborsByType('stack').forEach(r => r);

// const baseTest2 = new RouterBase<{}, string>({} as any);
