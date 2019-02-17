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

export type RouterState = { visible?: boolean };
export type RouterHistory = RouterState[];
export type OutputLocation = { pathname: Pathname, search: OutputSearch, options: Options };
export type InputLocation = { pathname: Pathname, search: InputSearch, options: Options };