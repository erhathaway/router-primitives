import Manager from './manager';
import RouterStore from './all_router_state';
import Router, {IInternalState} from './router_base';
import RouterCache from './all_router_cache';
import defaultTemplates from './router_templates';
import statePredicates from './state_predicates';

export * from './types';
export * from './types/manager';
export * from './types/router_base';
export * from './types/manager';
export * from './types/router_state';
export * from './types/router_templates';
export * from './types/serialized_state';

export * from './router_type_guards';

import {
    NativeSerializedStore,
    BrowserSerializedStore,
    serializer,
    deserializer,
    isMemorySerializedStateStore,
    isBrowserSerializedStateStore
} from './serialized_state';

export {
    defaultTemplates,
    RouterCache,
    Manager,
    Router,
    RouterStore,
    NativeSerializedStore,
    BrowserSerializedStore,
    serializer,
    deserializer,
    IInternalState,
    isMemorySerializedStateStore,
    isBrowserSerializedStateStore,
    statePredicates
};
