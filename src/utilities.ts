/**
 * Utility to correctly extract keys from an object without loosing typing.
 *
 */
// eslint-disable-next-line
export const objKeys = <T extends {}>(o: T): Array<keyof T> => <Array<keyof T>>Object.keys(o);
