import * as queryString from 'query-string';
import { Location, Options } from '../types/index';

const DEFAULT_LOCATION: Location = { pathname: [], search: { test: true }, options: {} };

const serializer = (newLocation: Location, oldLocation = DEFAULT_LOCATION): { location: string, options: Options } => {
  const newPathname = newLocation.pathname || [];
  const newSearchObj = newLocation.search || {};

  const oldSearchObj = oldLocation.search || {};
  const combinedSearchObj = { ...oldSearchObj, ...newSearchObj };

  Object.keys(combinedSearchObj).forEach(key => (combinedSearchObj[key] == null) && delete combinedSearchObj[key]);

  const searchString = queryString.stringify(combinedSearchObj, { arrayFormat: 'bracket' });
  const pathname = newPathname.join('/');
  const pathnameString = pathname === '' ? '/' : pathname;

  let location: string;
  if (searchString === '') {
    location = pathnameString;
  } else {
    location = `${pathnameString}?${searchString}`;
  }

  return { location, options: newLocation.options };
};

export default serializer;
