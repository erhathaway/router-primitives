// @flow

export type RouterType = 'scene' | 'feature' | 'stack' | 'data';

export type Location = {|
  pathname: string,
  search: Object,
|};

export type HookFn = Location => Location;

export type RouterHooks = {|
  beforeLocationUpdate: HookFn,
  afterLocationUpdate: HookFn,
  beforeStateUpdate: HookFn,
  afterStateUpdate: HookFn,
|};

export type RouterState = {|
  visible?: boolean,
  at?: Object,
  order?: ?number,
  data?: ?string,
|};

export type RouterConfig = {|
  name: string,
  routeKey?: string,
  routers?: Object,
  hooks?: RouterHooks,
  visible?: boolean,
  order?: number,
  isPathRouter?: boolean,
  state?: RouterState,
  rehydrateChildRoutersState?: boolean,
|};
