// @flow

import queryString from 'query-string';

import type {
  Location,
} from './types';

/* ------------------------ */
/* UPDATE ADDRESS STRING
/* ------------------------ */
const updateLocation = ({ pathname, search }: { pathname: string, search: string}) => {
  if (window && window.history) {
    const url = `${pathname}?${search}`;
    window.history.replaceState({ url }, '', url);
  }
  // TODO rewrite not using MST
  // getRoot(self).updateLocation({ pathname, search, state })
  // routerHistory.push({ pathname, search, state });
};

const setLocation = (newLocation: Location, oldLocation: Location) => {
  const { pathname: newPathname, search: newSearchObj } = newLocation;
  const { pathname: oldPathname, search: oldSearchString } = oldLocation;

  const parsedQuery = queryString.parse(oldSearchString, { decode: true, arrayFormat: 'bracket' });
  const newQuery = { ...parsedQuery, ...newSearchObj };
  Object.keys(newQuery).forEach(key => (newQuery[key] == null) && delete newQuery[key]);

  const newSearch = queryString.stringify(newQuery, { arrayFormat: 'bracket' });
  const pathname = newPathname || oldPathname;
  updateLocation({ pathname, search: newSearch });
};

export default setLocation;
