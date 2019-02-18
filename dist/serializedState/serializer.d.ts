import { InputLocation, Options } from '../types/index';
declare const serializer: (newLocation: InputLocation, oldLocation?: InputLocation) => {
    location: string;
    options: Options;
};
export default serializer;
