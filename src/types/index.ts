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

export type RouterCurrentState = { visible?: boolean };
export type RouterHistoryState = RouterCurrentState[];
export type RouterState = { current: RouterCurrentState, historical: RouterHistoryState };
export type OutputLocation = { pathname: Pathname, search: OutputSearch, options: Options };
export type InputLocation = { pathname: Pathname, search: InputSearch, options: Options };