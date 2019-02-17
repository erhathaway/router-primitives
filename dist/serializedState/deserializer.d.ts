import * as queryString from 'query-string';
declare const deserializer: (serializedLocation?: string) => {
    search: queryString.OutputParams;
    pathname: string[];
    options: {};
};
export default deserializer;
