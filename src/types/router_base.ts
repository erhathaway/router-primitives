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
    IInputLocation,
    ValueOf,
    IInputSearch,
    AllTemplates
} from '../types';

export interface IRouterBaseInternalState {
    isActive?: boolean;
}

export interface IRouterBase<
    CustomTemplates extends IRouterTemplates<unknown>,
    RouterTypeName extends NarrowRouterTypeName<keyof AllTemplates<CustomTemplates>>,
    InitArgs extends IRouterInitArgs<
        CustomTemplates,
        NarrowRouterTypeName<RouterTypeName>
    > = IRouterInitArgs<CustomTemplates, NarrowRouterTypeName<RouterTypeName>>
> {
    name: InitArgs['name'];
    type: InitArgs['type'];
    manager: InitArgs['manager'];
    parent?: Parent<CustomTemplates>;
    children: Childs<CustomTemplates>;
    root: Root<CustomTemplates>;
    getState?: InitArgs['getState'];
    subscribe?: InitArgs['subscribe'];
    config: InitArgs['config'];
    _EXPERIMENTAL_internal_state: IRouterBaseInternalState; // eslint-disable-line

    lastDefinedParentsDisableChildCacheState: boolean;

    routeKey: string;

    siblings: RouterInstance<CustomTemplates, RouterTypeName>[];

    data: ExtractCustomStateFromTemplate<AllTemplates<CustomTemplates>[RouterTypeName]>;

    /**
     * Returns all neighbors of a certain router type. This could include the same router type of this router if desired.
     */
    getNeighborsByType: <
        DesiredType extends NarrowRouterTypeName<keyof AllTemplates<CustomTemplates>>
    >(
        type: DesiredType
    ) => Array<RouterInstance<CustomTemplates, DesiredType>>;

    /**
     * Returns all neighboring routers. That is, all routers that have the same parent but are not of this router type.
     */
    getNeighbors: () => NeighborsOfType<
        CustomTemplates,
        NarrowRouterTypeName<Exclude<keyof AllTemplates<CustomTemplates>, RouterTypeName>>
    >;

    /**
     * Given a location object, returns location data for the router or undefined if none is found
     */
    getLocationDataFromLocationObject: (location: IInputLocation) => ValueOf<IInputSearch>;

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
    IRouterDeclaration<AllTemplates<CustomTemplates>> & {[key: string]: any};

    isPathRouter: boolean;

    state: RouterCurrentState<
        ExtractCustomStateFromTemplate<AllTemplates<CustomTemplates>[RouterTypeName]>
    >;

    history: RouterHistoricalState<
        ExtractCustomStateFromTemplate<AllTemplates<CustomTemplates>[RouterTypeName]>
    >;
}
