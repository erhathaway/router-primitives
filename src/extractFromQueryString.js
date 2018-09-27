import queryString from 'query-string';

/* ------------------------ */
/* Extract state from location (pathname and search)
/* ------------------------ */

const SCENE_NAME = 'page'; // used in the query to reference this data: <self.routeKey>page ex: docpage
const STACK_NAME = '@'; // used in the query to reference this data: <self.routeKey>modal ex: intromodal
const FEATURE_NAME = '$'; // used in the query to reference this data <self.routeKey>show ex: viewshow
const PAGE_NAME = '^'; // used in the query string to reference this data <self.routeKey>page ex: docpage

const extractScene = (location, routeKey) => {
  const path = location.pathname;
  const splitPath = path.split('/');

  if (routeKey === '' || !routeKey) {
    return splitPath[1];
  }

  const index = splitPath.findIndex(p => p === routeKey);

  if (index) {
    const thisPath = splitPath[index];
    return thisPath;
  }

  return undefined;
};

const extractStack = (location, routeKey) => {
  const parsedQuery = queryString.parse(location.search, { decode: true, arrayFormat: 'bracket' });
  console.log('extracting stack &&', parsedQuery)
  return parsedQuery[`${routeKey}${STACK_NAME}`];
};

const extractFeature = (location, routeKey) => {
  const parsedQuery = queryString.parse(location.search, { decode: true, arrayFormat: 'bracket' });
  return parsedQuery[`${routeKey}${FEATURE_NAME}`];
};

const extractPage = (location, routeKey) => {
  const parsedQuery = queryString.parse(location.search, { decode: true, arrayFormat: 'bracket' });
  return parsedQuery[`${routeKey}${PAGE_NAME}`];
};

export {
  extractScene,
  extractFeature,
  extractStack,
  extractPage,
}
