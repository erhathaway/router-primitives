import queryString from 'query-string';

// const joinLocationParts = ({ pathname, search }) => {
//   if (window && window.history) {
//     const url = `${pathname}?${search}`;
//     if (options.mutateExistingLocation) {
//       window.history.replaceState({ url }, '', url);
//     } else {
//       window.history.pushState({ url }, '', url);
//     }
//   }

const serializer = (newLocation, oldLocation) => {
  const { pathname: newPathname, search: newSearchObj } = newLocation;
  // const { search: oldSearchObj } = oldLocation;
  // const combinedSearchObj = { ...oldSearchObj, ...newSearchObj };
  const combinedSearchObj = { ...newSearchObj };
  
  Object.keys(combinedSearchObj).forEach(key => (combinedSearchObj[key] == null) && delete combinedSearchObj[key]);

  const searchString = queryString.stringify(combinedSearchObj, { arrayFormat: 'bracket' });
  const pathname = newPathname.join('/');
  const pathnameString = pathname === '' ? '/' : pathname;

  return { location: `${pathnameString}?${searchString}`, options: newLocation.options };
};

export default serializer;