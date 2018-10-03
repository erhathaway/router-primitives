import queryString from 'query-string';

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
};

const setLocation = (newLocation, oldLocation) => {
  const { pathname: newPathname, search: newSearchObj } = newLocation;
  const { pathname: oldPathname, search: oldSearchString } = oldLocation;

  const parsedQuery = queryString.parse(oldSearchString, { decode: true, arrayFormat: 'bracket' });
  const newQuery = { ...parsedQuery, ...newSearchObj };
  Object.keys(newQuery).forEach(key => (newQuery[key] == null) && delete newQuery[key]);

  const newSearch = queryString.stringify(newQuery, { arrayFormat: 'bracket' });
  const pathname = newLocation.pathname ? newLocation.pathname : oldLocation.pathname;
  updateLocation({ pathname, search: newSearch });
};

export default setLocation;
