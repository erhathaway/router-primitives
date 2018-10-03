import queryString from 'query-string';

/* ------------------------ */
/* Extract state from location (pathname and search)
/* ------------------------ */

const SCENE_NAME = 'page'; // used in the query to reference this data: <self.routeKey>page ex: docpage
const STACK_NAME = '@'; // used in the query to reference this data: <self.routeKey>modal ex: intromodal
const FEATURE_NAME = '$'; // used in the query to reference this data <self.routeKey>show ex: viewshow
const PAGE_NAME = '^'; // used in the query string to reference this data <self.routeKey>page ex: docpage

const extractScene = (location, routeKeys, isPathRouter, routerLevel) => {
  const parsedQuery = queryString.parse(location.search, { decode: true, arrayFormat: 'bracket' });

  // const sceneExists = parsedQuery[routeKey];
  if (isPathRouter) {
    const splitPath = location.pathname.split('/');
    const scenePresent = splitPath[routerLevel];

    const data = {};
    routeKeys.forEach(key => data[key] = false);
    if (routeKeys.includes(scenePresent)) {
      data[scenePresent] = true;
    }
    console.log(data, 'hur')
    return data;
  } else {
    const extractedSearchData = routeKeys.reduce((acc, key) => {
      acc[key] = parsedQuery[key] != null ? true : false;
      return acc;
    }, {});

    return extractedSearchData;
  }
  // const path = location.pathname;
  // const splitPath = path.split('/');
  //
  // if (routeKey === '' || !routeKey) {
  //   return splitPath[1];
  // }
  //
  // const index = splitPath.findIndex(p => p === routeKey);
  //
  // if (index) {
  //   const thisPath = splitPath[index];
  //   return thisPath;
  // }
  //
  // return undefined;
};

const extractStack = (location, routeKeys) => {
  // const parsedQuery = queryString.parse(location.search, { decode: true, arrayFormat: 'bracket' });
  // console.log('extracting stack &&', parsedQuery)
  // return parsedQuery[`${routeKey}${STACK_NAME}`];
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
    // acc[key] = parsedQuery[key] === 'show';
    acc[key] = parsedQuery[key] != null ? true : false;

    return acc;
  }, {});

  return extractedData;
};

// const extractPage = (location, routeKey) => {
//   const parsedQuery = queryString.parse(location.search, { decode: true, arrayFormat: 'bracket' });
//   return parsedQuery[`${routeKey}${PAGE_NAME}`];
// };

const extractData = (location, routeKeys) => {
  const parsedQuery = queryString.parse(location.search, { decode: true, arrayFormat: 'bracket' });
  const obj = {};
  routeKeys.forEach(key => {
    obj[key] = parsedQuery[key];
  });
  return obj;
}

export {
  extractScene,
  extractFeature,
  extractStack,
  // extractPage,
  extractData,
}
