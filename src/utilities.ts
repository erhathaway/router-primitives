/**
 * Uses type inference to extract string literal keys from an object
 *
 * From: https://github.com/microsoft/TypeScript/issues/24243
 */
// eslint-disable-next-line
export const getKeys = <T extends {}>(o: T): Array<keyof T> => <Array<keyof T>>Object.keys(o);
