import Manager from './manager';
import routerStateStore from './routerState';
import { NativeSerializedStore, BrowserSerializedStore } from './serializedState';
declare const _default: {
    Manager: typeof Manager;
    routerStateStore: typeof routerStateStore;
    NativeSerializedStore: typeof NativeSerializedStore;
    BrowserSerializedStore: typeof BrowserSerializedStore;
    serializer: (newLocation: import("./types").IInputLocation, oldLocation?: import("./types").IInputLocation) => {
        location: string;
        options: import("./types").ILocationOptions;
    };
    deserializer: (serializedLocation?: string) => import("./types").IOutputLocation;
};
export default _default;
