import queryString from 'query-string';

const deserializer = (serializedLocation = '') => {
  // return { pathname: [], search: {}, options: {} };
  const locationStringParts = serializedLocation.split('?');

  const search = queryString.parse(locationStringParts[1], { decode: true, arrayFormat: 'bracket' });
  const pathname = locationStringParts[0].split('/').filter(s => s !== '');

  return { search, pathname, options: {} };
};

export default deserializer;