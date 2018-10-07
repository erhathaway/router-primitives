// @flow

export type UpdateLocationOptions = {|
  mutateExistingLocation: ?boolean,
|};

export type RouterContext = {|
  routeKeys: Array<string>,
|}
export type RouterType = 'scene' | 'feature' | 'stack' | 'data';

export type Location = {|
  pathname: Array<string>,
  search: Object,
  options: UpdateLocationOptions,
|};

export type HookFn = Location => Location;

export type RouterHooks = {|
  beforeLocationUpdate: HookFn,
  afterLocationUpdate: HookFn,
  beforeStateUpdate: HookFn,
  afterStateUpdate: HookFn,
|};

export type TypeHistory = {
  [string]: number | string | boolean,
};

export type RouterHistory = {
  at: TypeHistory,
  from: TypeHistory
}

export type RouterState = {|
  visible: boolean,
  at?: TypeHistory,
  from?: TypeHistory,
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
  mutateLocationOnSceneUpdate?: boolean,
  mutateLocationOnStackUpdate?: boolean,
  mutateLocationOnDataUpdate?: boolean,
  mutateLocationOnFeatureUpdate?: boolean,
|};


export type Routers<T> = {
  [RouterType]: Array<T>
}

export type RouterInfoForCreation = {
  name: string,
  routeKey?: string,
  ...?RouterConfig,
  default?: RouterConfig,
  routers?: {
    stack?: [Array<RouterInfoForCreation>],
    scene?: [Array<RouterInfoForCreation>],
    feature?: [Array<RouterInfoForCreation>],
    data?: [Array<RouterInfoForCreation>],
  }
}
