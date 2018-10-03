import queryString from 'query-string';

/* ------------------------ */
/* Extract state from location (pathname and search)
/* ------------------------ */

const extractScene = (location, routeKeys, isPathRouter, routerLevel) => {
  const parsedQuery = queryString.parse(location.search, { decode: true, arrayFormat: 'bracket' });

  if (isPathRouter) {
    const splitPath = location.pathname.split('/');
    const scenePresent = splitPath[routerLevel];

    const data = {};
    routeKeys.forEach(key => data[key] = false);
    if (routeKeys.includes(scenePresent)) {
      data[scenePresent] = true;
    }
    return data;
  } else {
    const extractedSearchData = routeKeys.reduce((acc, key) => {
      acc[key] = parsedQuery[key] != null ? true : false;
      return acc;
    }, {});

    return extractedSearchData;
  }
};

const extractStack = (location, routeKeys) => {
  const parsedQuery = queryString.parse(location.search, { decode: true, arrayFormat: 'bracket' });
  const obj = {};
  routeKeys.forEach(key => {
    const order = +parsedQuery[key];
    obj[key] = order != null && !isNaN(order) ? order : undefined;
  });

  // remove undefined keys;
  Object.keys(obj).forEach((key) => (obj[key] == null) && delete obj[key]);

  return obj;
};

const extractFeature = (location, routeKeys) => {
  const parsedQuery = queryString.parse(location.search, { decode: true, arrayFormat: 'bracket' });

  const extractedData = routeKeys.reduce((acc, key) => {
    acc[key] = parsedQuery[key] != null ? true : false;

    return acc;
  }, {});

  return extractedData;
};

const extractData = (location, routeKeys, isPathRouter, routerLevel, router) => {
  const parsedQuery = queryString.parse(location.search, { decode: true, arrayFormat: 'bracket' });

  if (isPathRouter) {
    const splitPath = location.pathname.split('/');
    const dataPresent = splitPath[routerLevel];

    const data = {};
    routeKeys.forEach(key => data[key] = undefined);
    if (router && router.state && dataPresent === router.state.data) {
      data[router.routeKey] = dataPresent;
    }
    return data;
  } else {
    const obj = {};
    routeKeys.forEach(key => {
      obj[key] = parsedQuery[key];
    });
    return obj;
  }
}

export {
  extractScene,
  extractFeature,
  extractStack,
  extractData,
}
