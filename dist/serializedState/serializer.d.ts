import { IInputLocation } from '../types/index';
declare const serializer: (newLocation: IInputLocation, oldLocation?: IInputLocation) => {
    location: string;
    options: import("../types").IOptions;
};
export default serializer;
