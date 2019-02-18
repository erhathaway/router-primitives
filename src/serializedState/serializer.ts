import * as queryString from 'query-string';
import { InputLocation, Options } from '../types/index';

const DEFAULT_LOCATION: InputLocation = { pathname: [], search: {}, options: {} };

const serializer = (newLocation: InputLocation, oldLocation = DEFAULT_LOCATION) => {
  const newPathname = newLocation.pathname || [];
  const newSearchObj = newLocation.search || {};

  const oldSearchObj = oldLocation.search || {};
  const combinedSearchObj = { ...oldSearchObj, ...newSearchObj } as { [key: string]: string };

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
