import { Location, Options } from '../types/index';
declare const serializer: (newLocation: Location, oldLocation?: Location) => {
    location: string;
    options: Options;
};
export default serializer;
