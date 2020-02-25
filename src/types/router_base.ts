import Cache from '../router/cache';
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
    Root
} from '../types';
import {DefaultTemplates} from './router_templates';

export interface IRouterBaseInternalState {
    isActive?: boolean;
}

export interface IRouterBase<
    Templates extends IRouterTemplates,
    RouterTypeName extends NarrowRouterTypeName<keyof Templates>,
    InitArgs extends IRouterInitArgs<Templates, RouterTypeName> = IRouterInitArgs<
        Templates,
        RouterTypeName
    >
> {
    name: InitArgs['name'];
    type: InitArgs['type'];
    manager: InitArgs['manager'];
    parent?: Parent<Templates>;
    routers: Childs<Templates>;
    root: Root<Templates>;
    getState?: InitArgs['getState'];
    subscribe?: InitArgs['subscribe'];
    config: InitArgs['config'];
    cache: Cache<Templates, RouterTypeName>;
    _EXPERIMENTAL_internal_state: IRouterBaseInternalState; // eslint-disable-line

    lastDefinedParentsDisableChildCacheState: boolean;

    routeKey: string;

    siblings: RouterInstance<Templates, RouterTypeName>[];

    /**
     * Returns all neighbors of a certain router type. This could include the same router type of this router if desired.
     */
    getNeighborsByType: <DesiredType extends NarrowRouterTypeName<keyof Templates>>(
        type: DesiredType
    ) => Array<RouterInstance<Templates, DesiredType>>;

    /**
     * Returns all neighboring routers. That is, all routers that have the same parent but are not of this router type.
     */
    getNeighbors: () => NeighborsOfType<
        Templates,
        NarrowRouterTypeName<Exclude<keyof Templates, RouterTypeName>>
    >;

    pathLocation: number;

    isRootRouter: boolean;

    EXPERIMENTAL_setInternalState: (internalState: IRouterBaseInternalState) => void;
    // eslint-disable-next-line
    EXPERIMENTAL_internal_state: IRouterBaseInternalState;

    /**
     * Return serialized information about this router
     * and all of its children routers.
     * Useful for debugging.
     *
     * Returns a router serialization object tree
     */
    serialize: (
        options: ISerializeOptions
    ) => // eslint-disable-next-line
    IRouterDeclaration<Templates> & {[key: string]: any};

    isPathRouter: boolean;

    state: RouterCurrentState<ExtractCustomStateFromTemplate<Templates[RouterTypeName]>>;

    history: RouterHistoricalState<ExtractCustomStateFromTemplate<Templates[RouterTypeName]>>;
}
