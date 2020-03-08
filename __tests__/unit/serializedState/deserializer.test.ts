import {deserializer} from '../../../src/serialized_state';

describe('deserializer', () => {
    it('deserializes a string with only a pathname', () => {
        const stateOne = 'hello/world?';
        expect(deserializer(stateOne)).toEqual({
            pathname: ['hello', 'world'],
            search: {},
            options: {}
        });

        const stateTwo = 'other/world';
        expect(deserializer(stateTwo)).toEqual({
            pathname: ['other', 'world'],
            search: {},
            options: {}
        });
    });

    it('deserializes a string with only query params', () => {
        const stateOne = '/?hello=world&test=1';
        expect(deserializer(stateOne)).toEqual({
            pathname: [],
            search: {hello: 'world', test: '1'},
            options: {}
        });

        const stateTwo = '?hello=universe&test=2';
        expect(deserializer(stateTwo)).toEqual({
            pathname: [],
            search: {hello: 'universe', test: '2'},
            options: {}
        });
    });

    it('deserializes a string with a pathname and query params', () => {
        const stateOne = 'is/a/test?hello=world&test=1';
        expect(deserializer(stateOne)).toEqual({
            pathname: ['is', 'a', 'test'],
            search: {hello: 'world', test: '1'},
            options: {}
        });

        const stateTwo = 'is/not/a/test/?hello=planet&test=25';
        expect(deserializer(stateTwo)).toEqual({
            pathname: ['is', 'not', 'a', 'test'],
            search: {hello: 'planet', test: '25'},
            options: {}
        });
    });
});
