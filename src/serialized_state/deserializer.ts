import * as queryString from 'query-string';
import {IOutputLocation} from '../types';
import {SerializedStateDeserializer} from '../types/serialized_state';

const deserializer: SerializedStateDeserializer = (serializedLocation = ''): IOutputLocation => {
    const locationStringParts = serializedLocation.split('?');

    const search = queryString.parse(locationStringParts[1], {
        decode: true,
        arrayFormat: 'bracket'
    });
    const pathname = locationStringParts[0].split('/').filter(s => s !== '');

    return {search, pathname};
};

export default deserializer;
