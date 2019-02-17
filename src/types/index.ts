export type Search = {
  test: Boolean
};

export type Options = {

};

type Pathname = string[];

export type Location = { pathname: Pathname, search: Search, options: Options };