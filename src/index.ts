import Manager from './manager';
import routerStateStore from './routerState';
import {
  NativeSerializedStore,
  BrowserSerializedStore,
  serializer,
  deserializer,
} from './serializedState';

export default {
  Manager,
  routerStateStore,
  NativeSerializedStore,
  BrowserSerializedStore,
  serializer,
  deserializer,
};
