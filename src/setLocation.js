// @flow

import queryString from 'query-string';

import type {
  Location,
  UpdateLocationOptions,
} from './types';

/* ------------------------ */
/* UPDATE ADDRESS STRING
/* ------------------------ */

const defaultOptions: UpdateLocationOptions = { mutateExistingLocation: false};
const updateLocation = ({ pathname, search }: { pathname: string, search: string}, options: UpdateLocationOptions = defaultOptions) => {
  if (window && window.history) {
    const url = `${pathname}?${search}`;
    if (options.mutateExistingLocation) {
      window.history.replaceState({ url }, '', url);
    } else {
      window.history.pushState({ url }, '', url);
    }

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

  updateLocation({ pathname: cleansedPathname, search }, newLocation.options);
};

export default setLocation;
