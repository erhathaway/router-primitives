import RouterBase from "../router/base";
import Manager from '../manager';
/**
 * Location types
 */
export interface IInputSearch {
  [key: string]: any;
};

export interface IOutputSearch {
  [key: string]: string | string[] | undefined;
}

export interface ILocationOptions {
  data?: string;
  replaceLocation?: boolean; // used to replace history location in URL
};

type Pathname = string[];

export interface IOutputLocation { 
  pathname: Pathname;
  search: IOutputSearch;
  options: ILocationOptions;
};
export interface IInputLocation { 
  pathname: Pathname;
  search: IInputSearch;
  options: ILocationOptions;
};

export interface ILocationActionContext {
  disableCaching?: boolean;
  addingDefaults?: boolean;
}

/**
 * Rotuer template types
 */
export interface IRouter extends RouterBase {
  show: RouterAction;
  hide: RouterAction;
  reducer: RouterReducer;
}

// at the moment these should be the same
export type IRouterActionOptions = ILocationOptions;

export type RouterAction = (options?: IRouterActionOptions, location?: IInputLocation, router?: IRouter, ctx?: ILocationActionContext) => IInputLocation
export type RouterReducer = (location: IInputLocation, router: IRouter, ctx: { [key: string]: any }) => { [key: string]: any }

export interface IRouterTemplate {
  actions: { [actionName: string]: RouterAction };
  reducer: RouterReducer;
}
/**
 * Router state types
 */
export interface IRouterCurrentState {
  visible?: boolean;
  data?: string;
};

export type RouterHistoryState = IRouterCurrentState[];
export interface IRouterState { 
  current: IRouterCurrentState;
  historical: RouterHistoryState;
};

/**
 * Router declaration object
 */

 export interface IRouterDeclaration {
  name: string;
  routers?: { [key: string]: IRouterDeclaration[] };
  routeKey?: string;
  disableCaching?: boolean;
  defaultShow?: boolean;
  type?: string;
  parentName?: string;
 }

export interface IRouterConfig {
  routeKey?: string;
  isPathRouter?: boolean;
  // default actions to call when immediate parent visibility changes from hidden -> visible
  disableCaching?: boolean;
  defaultShow?: boolean;
}

export type Observer = (state: IRouterState) => any;

export interface IRouterInitParams {
  name: string;
  routeKey?: string;
  config: IRouterConfig;
  type?: string;
  parentName?: string;
}

export interface IRouterInitArgs {
  name: string,
  config: IRouterConfig
  type: string,
  parent?: IRouter,
  routers: { [type: string]: [IRouter] },
  manager: Manager,
  root?: IRouter,
  getState?: () => any,
  subscribe?: (observer: Observer) => any;
}