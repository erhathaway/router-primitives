import {objKeys} from './utilities';

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
    NarrowRouterTypeName,
    Childs,
    Parent,
    Root,
    IInputSearch,
    IInputLocation,
    ValueOf,
    AllTemplates,
    LinkOptions
} from './types';
import {IRouterBase} from './types/router_base';

export interface IInternalState {
    isActive?: boolean;
}

export default class RouterBase<
    CustomTemplates extends IRouterTemplates,
    RouterTypeName extends NarrowRouterTypeName<keyof AllTemplates<CustomTemplates>>,
    InitArgs extends IRouterInitArgs<
        CustomTemplates,
        NarrowRouterTypeName<RouterTypeName>
    > = IRouterInitArgs<CustomTemplates, NarrowRouterTypeName<RouterTypeName>>
> implements IRouterBase<CustomTemplates, RouterTypeName, InitArgs> {
    public name: InitArgs['name'];
    public type: InitArgs['type'];
    public manager: InitArgs['manager'];
    public parent?: Parent<CustomTemplates>;
    public children: Childs<CustomTemplates>;
    public root: Root<CustomTemplates>;
    public getState?: InitArgs['getState'];
    public subscribe?: InitArgs['subscribe'];
    public config: InitArgs['config'];
    public _EXPERIMENTAL_internal_state: IInternalState; // eslint-disable-line

    constructor(init: InitArgs) {
        const {
            name,
            config,
            type,
            manager,
            parent,
            children,
            root,
            getState,
            subscribe,
            actions
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
        this.children = children || {};
        this.root = root;

        // methods customized for instance from manager
        this.getState = getState;
        this.subscribe = subscribe;

        this._EXPERIMENTAL_internal_state = {}; // eslint-disable-line

        // TODO fix test so empty array isn't needed
        // TODO add tests for this
        // Since actions come from the template and are decorated by the manager, we need to bind them
        // to the router instance where they live
        (actions || []).forEach(actionName => {
            // eslint-disable-next-line
            if ((this as Record<any, any>)[actionName]) {
                // eslint-disable-next-line
                (this as any)[actionName] = (this as any)[actionName].bind(this);
            }
        });
    }

    public link = (
        actionName: string,
        options?: LinkOptions<
            ExtractCustomStateFromTemplate<AllTemplates<CustomTemplates>[RouterTypeName]>
        >
    ): string => {
        return this.manager.linkTo(this.name, actionName, options);
    };

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
        return this.config.routeKey || this.name;
    }

    get data(): ExtractCustomStateFromTemplate<AllTemplates<CustomTemplates>[RouterTypeName]> {
        return this.state.data
            ? this.state.data
            : this.manager.routerCache.cache[this.name]
            ? this.manager.routerCache.cache[this.name].data
            : undefined;
    }

    get siblings(): RouterInstance<CustomTemplates, RouterTypeName>[] {
        return this.parent.children[this.type].filter(r => r.name !== this.name);
    }

    /**
     * Returns all neighbors of a certain router type. This could include the same router type of this router if desired.
     */
    public getNeighborsByType<
        DesiredType extends NarrowRouterTypeName<keyof AllTemplates<CustomTemplates>>
    >(type: DesiredType): Array<RouterInstance<CustomTemplates, DesiredType>> {
        if (this.parent && this.parent.children) {
            return this.parent.children[type] || [];
        }
        return [];
    }

    /**
     * Given a location object, returns location data for the router or undefined if none is found
     */
    public getLocationDataFromLocationObject = (
        location: IInputLocation
    ): ValueOf<IInputSearch> => {
        return this.isPathRouter
            ? location.pathname[this.pathLocation]
            : location.search[this.routeKey];
    };

    /**
     * Returns all neighboring routers. That is, all routers that have the same parent but are not of this router type.
     */
    public getNeighbors(): NeighborsOfType<
        CustomTemplates,
        NarrowRouterTypeName<Exclude<keyof AllTemplates<CustomTemplates>, RouterTypeName>>
    > {
        if (!this.parent) {
            return [];
        }

        // eslint-disable-next-line
        const flattened = (acc: any[], arr: any[]): any[] => acc.concat(...arr);

        return objKeys(this.parent.children)
            .filter(t => t !== this.type)
            .map(t => this.parent.children[t])
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
    ): IRouterDeclaration<AllTemplates<CustomTemplates>> & {[key: string]: any} {
        // create router declaration object
        // TODO clean up this mess
        const serialized: IRouterDeclaration<AllTemplates<CustomTemplates>> & {
            // eslint-disable-next-line
            [key: string]: any;
        } = {
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
        const childRouterTypes = Object.keys(this.children);
        const childRouters = childRouterTypes.reduce((acc, type) => {
            // eslint-disable-next-line
            acc[type] = this.children[type].map(childRouter => childRouter.serialize(options));
            return acc;
        }, {} as {[routerType: string]: IRouterDeclaration<AllTemplates<CustomTemplates>>[]});

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
            	but one of its parent routers doesn't have this permission.
            	Make sure all parents have 'isPathRouter' attribute set to 'true' in the router config OR
            	Make sure all parents are of router type 'scene' or 'data'.
            	If the routers parents have siblings of both 'scene' and 'data' the 'scene' router will always be used for the pathname
              `);
        }

        return false;
    }

    get state(): RouterCurrentState<
        ExtractCustomStateFromTemplate<AllTemplates<CustomTemplates>[RouterTypeName]>
    > {
        return this._state();
    }

    protected _state = (): RouterCurrentState<
        ExtractCustomStateFromTemplate<AllTemplates<CustomTemplates>[RouterTypeName]>
    > & {isActive?: boolean} => {
        if (!this.getState) {
            throw new Error('no getState function specified by the manager');
        }
        const {current} = this.getState();
        const newState = current || {};
        return {...newState, ...this.EXPERIMENTAL_internal_state} as RouterCurrentState<
            ExtractCustomStateFromTemplate<AllTemplates<CustomTemplates>[RouterTypeName]>
        > & {isActive?: boolean};
    };

    public get history(): RouterHistoricalState<
        ExtractCustomStateFromTemplate<AllTemplates<CustomTemplates>[RouterTypeName]>
    > {
        return this._history();
    }

    protected _history = (): RouterHistoricalState<
        ExtractCustomStateFromTemplate<AllTemplates<CustomTemplates>[RouterTypeName]>
    > => {
        if (!this.getState) {
            throw new Error('no getState function specified by the manager');
        }
        const {historical} = this.getState();
        return historical || [];
    };
}
