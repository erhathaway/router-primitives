import NativeSerializedStore from './native_store';
import BrowserSerializedStore from './browser_store';
import {ISerializedStateStore} from '../types/serialized_state';
export {default as NativeSerializedStore} from './native_store';
export {default as BrowserSerializedStore} from './browser_store';
export {default as serializer} from './serializer';
export {default as deserializer} from './deserializer';

export const isMemorySerializedStateStore = (
    store: NativeSerializedStore | ISerializedStateStore
): store is NativeSerializedStore => {
    return (store as NativeSerializedStore).kind === 'memory';
};

export const isBrowserSerializedStateStore = (
    store: BrowserSerializedStore | ISerializedStateStore
): store is BrowserSerializedStore => {
    return (store as BrowserSerializedStore).kind === 'browser';
};
