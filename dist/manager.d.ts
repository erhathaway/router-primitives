import { NativeSerializedStore, BrowserSerializedStore } from './serializedState';
import DefaultRouterStateStore from './routerState';
import { RouterDeclaration, Router as RouterT, InputLocation, LocationActionContext, RouterAction, OutputLocation } from './types';
declare type Init = {
    routerTree?: RouterDeclaration;
    serializedStateStore?: NativeSerializedStore | BrowserSerializedStore;
    routerStateStore?: DefaultRouterStateStore;
};
export default class Manager {
    serializedStateStore: Init['serializedStateStore'];
    routerStateStore: Init['routerStateStore'];
    routers: {
        [routerName: string]: RouterT;
    };
    rootRouter: RouterT;
    routerTypes: {
        [routerType: string]: RouterT;
    };
    constructor({ routerTree, serializedStateStore, routerStateStore }?: Init);
    /**
     * Adds the initial routers defined during initialization
     * @param {*} router
     *
     */
    addRouters(router?: RouterDeclaration, type?: string, parentName?: string): void;
    addRouter({ name, routeKey, config, defaultShow, disableCaching, type, parentName }: RouterDeclaration): void;
    static setChildrenDefaults(location: InputLocation, router: RouterT, ctx: LocationActionContext): {
        pathname: string[];
        search: import("./types").InputSearch;
        options: import("./types").Options;
    };
    static setCacheAndHide(location: InputLocation, router: RouterT, ctx?: LocationActionContext): InputLocation;
    static createActionWrapperFunction(action: RouterAction, type: string): (existingLocation: OutputLocation, routerInstance?: any, ctx?: LocationActionContext) => InputLocation;
    static addLocationDefaults(location: InputLocation, routerInstance: RouterT, ctx?: LocationActionContext): {
        pathname: string[];
        search: import("./types").InputSearch;
        options: import("./types").Options;
    };
    createRouter({ name, routeKey, config, defaultShow, disableCaching, type, parentName }: RouterDeclaration): RouterT;
    removeRouter(name: string): void;
    setNewRouterState(location: InputLocation): void;
    calcNewRouterState(location: InputLocation, router: RouterT, ctx?: LocationActionContext, newState?: {
        [routerName: string]: {};
    }): {
        [routerName: string]: {};
    };
}
export {};
