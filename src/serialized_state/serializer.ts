import * as queryString from 'query-string';
import {IInputLocation} from '../types/index';
import {SerializedStateSerializer} from '../types/serialized_state';

const DEFAULT_LOCATION: IInputLocation = {pathname: [], search: {}, options: {}};

const serializer: SerializedStateSerializer = (
    newLocation: IInputLocation,
    oldLocation = DEFAULT_LOCATION
) => {
    const newPathname = newLocation.pathname || [];
    const newSearchObj = newLocation.search || {};

    const oldSearchObj = oldLocation.search || {};
    const combinedSearchObj = {...oldSearchObj, ...newSearchObj} as {[key: string]: string};

    Object.keys(combinedSearchObj).forEach(
        key => combinedSearchObj[key] == null && delete combinedSearchObj[key]
    );

    const searchString = queryString.stringify(combinedSearchObj, {arrayFormat: 'bracket'});
    const pathname = newPathname.join('/');

    // TODO add test to make sure that pathnameString always has a leading /
    const pathnameString = pathname === '' ? '/' : `/${pathname}`;

    let location: string;
    if (searchString === '') {
        location = pathnameString;
    } else {
        location = `${pathnameString}?${searchString}`;
    }
    return {location, options: newLocation.options};
};

export default serializer;
