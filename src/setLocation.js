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
  const { search: oldSearchObj } = oldLocation;

  const combinedSearchObj = { ...oldSearchObj, ...newSearchObj };
  Object.keys(combinedSearchObj).forEach(key => (combinedSearchObj[key] == null) && delete combinedSearchObj[key]);

  const search = queryString.stringify(combinedSearchObj, { arrayFormat: 'bracket' });
  const pathname = newPathname.join('/');

  const cleansedPathname = pathname === '' ? '/' : pathname;

  updateLocation({ pathname: cleansedPathname, search });
};

export default setLocation;
