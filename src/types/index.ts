import RouterBase from "../router/base";

/**
 * Location types
 */
export interface InputSearch {
  [key: string]: any;
};

export interface OutputSearch {
  [key: string]: string | string[] | undefined;
}

export type Options = {
  replaceLocation?: boolean // used to replace history location in URL
};

type Pathname = string[];

export type OutputLocation = { pathname: Pathname, search: OutputSearch, options: Options };
export type InputLocation = { pathname: Pathname, search: InputSearch, options: Options };

export type LocationActionContext = {
  disableCaching?: boolean
}

/**
 * Rotuer template types
 */
export interface Router extends RouterBase {
  show: RouterAction;
  hide: RouterAction;
  reducer: RouterReducer;
}
export type RouterAction = (location?: InputLocation, router?: Router, ctx?: { [key: string]: any }) => InputLocation
export type RouterReducer = (location: InputLocation, router: Router, ctx: { [key: string]: any }) => { [key: string]: any }

export type RouterTemplate = {
  actions: { [actionName: string]: RouterAction },
  reducer: RouterReducer,
}
/**
 * Router state types
 */
export type RouterCurrentState = { visible?: boolean };
export type RouterHistoryState = RouterCurrentState[];
export type RouterState = { current: RouterCurrentState, historical: RouterHistoryState };

/**
 * Router declaration object
 */

 export type RouterDeclaration = {
  name: string;
  routers?: { [key: string]: RouterDeclaration[] }
  routeKey?: string,
  config?: { [key: string]: boolean },
  defaultShow?: boolean,
  disableCaching?: boolean,
  type?: string,
  parentName?: string
 }