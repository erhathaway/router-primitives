import { NativeSerializedStore, BrowserSerializedStore } from './serializedState';
import DefaultRouterStateStore from './routerState';
import { IRouterDeclaration, IRouter as RouterT } from './types';
interface IInit {
    routerTree?: IRouterDeclaration;
    serializedStateStore?: NativeSerializedStore | BrowserSerializedStore;
    routerStateStore?: DefaultRouterStateStore;
}
export default class Manager {
    private static setChildrenDefaults;
    private static setCacheAndHide;
    private static createActionWrapperFunction;
    private static addLocationDefaults;
    routers: {
        [routerName: string]: RouterT;
    };
    rootRouter: RouterT;
    serializedStateStore: IInit['serializedStateStore'];
    routerStateStore: IInit['routerStateStore'];
    private routerTypes;
    constructor({ routerTree, serializedStateStore, routerStateStore }?: IInit);
    /**
     * Adds the initial routers defined during initialization
     * @param {*} router
     *
     */
    addRouters(router?: IRouterDeclaration, type?: string, parentName?: string): void;
    addRouter({ name, routeKey, config, defaultShow, disableCaching, type, parentName }: IRouterDeclaration): void;
    removeRouter(name: string): void;
    private createRouter;
    private setNewRouterState;
    private calcNewRouterState;
}
export {};
