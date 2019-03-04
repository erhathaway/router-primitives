import { serializer } from '../../../src/serializedState';

describe('Serializer', () => {
  it('serializes pathname', () => {
    const location = { pathname: ['hi', 'there'] };
    const serialized = (serializer as any)(location);

    expect(serialized.location).toBe('/hi/there');
  });

  it('serializes search', () => {
    const location = { search: { param1: '1', param2: 'hello' } };
    const serialized = (serializer as any)(location);

    expect(serialized.location).toBe('/?param1=1&param2=hello');
  });

  it('serializes both pathname and search', () => {
    const location = { pathname: ['hi', 'there'], search: { param1: '1', param2: 'hello' } };
    const serialized = (serializer as any)(location);

    expect(serialized.location).toBe('/hi/there?param1=1&param2=hello');
  });

  it('adds in previous queryParam keys that are not specified in the current location', () => {
    const oldLocation = { pathname: ['hi', 'there'], search: { param1: '1', param2: 'hello' } };
    const newLocation = { pathname: ['good', 'day'], search: { param1: '25' } };

    const serialized = (serializer as any)(newLocation, oldLocation);
    expect(serialized.location).toEqual('/good/day?param1=25&param2=hello');
  });

  it('removes previous queryParam keys that are set to "undefined"', () => {
    const oldLocation = { pathname: ['hi', 'there'], search: { param1: '1', param2: 'hello' } };
    const newLocation = { pathname: ['good', 'day'], search: { param1: '25', param2: undefined } };

    const serialized = (serializer as any)(newLocation, oldLocation);
    expect(serialized.location).toEqual('/good/day?param1=25');
  });

  it('removes previous queryParam keys that are set to "null"', () => {
    const oldLocation = { pathname: ['hi', 'there'], search: { param1: '1', param2: 'hello' } };
    const newLocation = { pathname: ['good', 'day'], search: { param1: '25', param2: null } };

    const serialized = (serializer as any)(newLocation, oldLocation);
    expect(serialized.location).toEqual('/good/day?param1=25');
  });
});