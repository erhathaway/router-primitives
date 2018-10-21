// @flow

import type {
  Location,
} from './types';

import type Router from './index';

/**
 * Extract state from location (pathname and search)
 */
const extractScene = ({ pathname, search }: Location, routeKeys: Array<string>, isPathRouter: boolean, routerLevel: number) => {
  if (isPathRouter) {
    const scenePresent = pathname[routerLevel];

    const data = {};
    routeKeys.forEach((key) => { data[key] = false; });
    if (routeKeys.includes(scenePresent)) {
      if (scenePresent) data[scenePresent] = true;
    }
    return data;
  }

  const extractedScenes = routeKeys.reduce((acc, key) => {
    acc[key] = search[key] != null;
    return acc;
  }, {});

  return (extractedScenes: { [string]: boolean });
};

const extractStack = ({ search }: Location, routeKeys: Array<string>) => {
  // const parsedQuery = queryString.parse(location.search, { decode: true, arrayFormat: 'bracket' });
  // obj representes the extracted stack data
  const obj = {};
  routeKeys.forEach((key) => {
    const order = +search[key];
    obj[key] = order != null && !Number.isNaN(order) ? order : undefined;
  });

  // remove undefined keys;
  Object.keys(obj).forEach(key => (obj[key] == null) && delete obj[key]);

  return (obj: { [string]: number });
};

const extractFeature = ({ search }: Location, routeKeys: Array<string>) => {
  const obj = routeKeys.reduce((acc, key) => {
    acc[key] = search[key] != null;

    return acc;
  }, {});

  return (obj: { [string]: boolean });
};

const extractData = ({ pathname, search }: Location, routeKeys: Array<string>, isPathRouter: boolean, routerLevel: number, router: Router) => {
  if (isPathRouter) {
    const dataPresent = pathname[routerLevel];

    const data = {};
    routeKeys.forEach((key) => { data[key] = undefined; });
    if (router && router.state && dataPresent === router.state.data) {
      data[router.routeKey] = dataPresent;
    }
    return data;
  }

  const obj = {};
  routeKeys.forEach((key) => {
    obj[key] = search[key];
  });
  return obj;
};

export {
  extractScene,
  extractFeature,
  extractStack,
  extractData,
};
