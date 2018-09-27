
import queryString from 'query-string';

/* ------------------------ */
/* CONSTANTS */
/* ------------------------ */
const SCENE_NAME = 'page'; // used in the query to reference this data: <self.routeKey>page ex: docpage
// const SCENE_METHOD_SUFFIX = 'Page'; // prefix is 'navTo', ex: switchTo<Name>Page()` such as `switchToExplorePage()`

const STACK_NAME = '@'; // used in the query to reference this data: <self.routeKey>modal ex: intromodal
const STACK_METHOD_SUFFIX = 'Modal'; // prefixes are 'open' and 'close', ex: `open<Name>Modal()` such as `openViewModal()`

const FEATURE_NAME = '$'; // used in the query to reference this data <self.routeKey>show ex: viewshow
const FEATURE_METHOD_SUFFIX = 'Feature'; // prefixes are 'show' and 'hide' - ex: `show<Name>Feature()` such as `showLibraryFeature()`

const PAGE_NAME = '^'; // used in the query string to reference this data <self.routeKey>page ex: docpage


/* ------------------------ */
/* UPDATE ADDRESS STRING
/* ------------------------ */
const updateLocation = ({ pathname, search }) => {
  if (window && window.history) {
    const url = `${pathname}?${search}`;
    window.history.pushState('', '', url);
  }
  // TODO rewrite not using MST
  // getRoot(self).updateLocation({ pathname, search, state })
  // routerHistory.push({ pathname, search, state });
}

// (routerType, { routerName: value })
const updateRouterTypeObject = (routerType, routerTypeObject, { pathname, search }) => {
  const parsedQuery = queryString.parse(search, { decode: true, arrayFormat: 'bracket' });
  const newQuery = { ...parsedQuery, ...routerTypeObject };
  Object.keys(newQuery).forEach(key => (newQuery[key] == null) && delete newQuery[key]);

  const newSearch = queryString.stringify(newQuery, { arrayFormat: 'bracket' });

  updateLocation({ pathname, search: newSearch });
}

export {
  updateRouterTypeObject
}
