import {NativeSerializedStore} from '../../../src/serialized_state';

describe('Native Serialized State', () => {
    describe('Store state', () => {
        test('Uses a default string for state', () => {
            const adapter = new NativeSerializedStore();
            expect(adapter.getState()).toEqual({pathname: [], search: {}, options: {}});
        });

        test('Can write to store', () => {
            const adapter = new NativeSerializedStore();
            const location = {
                pathname: ['test'],
                search: {param1: '2', param2: 'testparam'},
                options: {}
            };
            adapter.setState(location);

            expect(adapter.getState()).not.toBe(location);
            expect(adapter.getState()).toEqual(location);
        });

        test('Can observe store state changes', () => {
            const adapter = new NativeSerializedStore();
            const subscriptionOne = jest.fn();
            const subscriptionTwo = jest.fn();

            adapter.subscribeToStateChanges(subscriptionOne);
            const stateOne = {
                pathname: ['newState'],
                search: {param1: '2', param2: 'testparam'},
                options: {}
            };
            adapter.setState(stateOne);

            adapter.subscribeToStateChanges(subscriptionTwo);

            const stateTwo = {
                pathname: ['newStateOther'],
                search: {param1: '3', param2: undefined},
                options: {}
            };
            adapter.setState(stateTwo);
            expect(subscriptionOne.mock.calls).toHaveLength(2);
            expect(subscriptionOne.mock.calls[0][0]).toEqual(stateOne);
            expect(subscriptionOne.mock.calls[1][0]).toEqual(stateTwo);

            expect(subscriptionTwo.mock.calls).toHaveLength(1);
            expect(subscriptionTwo.mock.calls[0][0]).toEqual(stateTwo);
        });

        test('Can unsubscribe from store state changes', () => {
            const store = new NativeSerializedStore();
            const testFnA = jest.fn();
            const testFnB = jest.fn();
            const testFnC = jest.fn();

            store.subscribeToStateChanges(testFnA);
            store.subscribeToStateChanges(testFnB);
            store.subscribeToStateChanges(testFnC);

            const state = {pathname: ['newState'], search: {}, options: {}};
            store.setState(state);

            expect(testFnA.mock.calls).toHaveLength(1);
            expect(testFnB.mock.calls).toHaveLength(1);
            expect(testFnC.mock.calls).toHaveLength(1);

            store.unsubscribeFromStateChanges(testFnA);

            const nextState = {pathname: ['newState'], search: {update: 'yest'}, options: {}};
            store.setState(nextState);

            expect(testFnA.mock.calls).toHaveLength(1);
            expect(testFnB.mock.calls).toHaveLength(2);
            expect(testFnC.mock.calls).toHaveLength(2);
        });

        test('Use the previous location to fill in missing queryParams when saving a new location', () => {
            const adapter = new NativeSerializedStore();
            const subscription = jest.fn();
            adapter.subscribeToStateChanges(subscription);

            const stateOne = {
                pathname: ['here/newState'],
                search: {param1: '2', param2: 'testparam'},
                options: {}
            };
            adapter.setState(stateOne);

            const stateTwo = {pathname: ['there'], search: {param1: '3'}, options: {}};
            adapter.setState(stateTwo);

            expect(subscription.mock.calls[0][0]).toEqual({
                pathname: ['here', 'newState'],
                search: {param1: '2', param2: 'testparam'},
                options: {}
            });
            expect(subscription.mock.calls[1][0]).toEqual({
                pathname: ['there'],
                search: {param1: '3', param2: 'testparam'},
                options: {}
            });
        });
    });

    describe('Store history', () => {
        const locationOne = {pathname: ['home'], search: {}, options: {}};
        const locationTwo = {pathname: ['user', '22'], search: {showNav: 'true'}, options: {}};
        const locationThree = {
            pathname: ['docs', 'about'],
            search: {showNav: undefined, docId: '2'},
            options: {}
        };
        const locationFour = {
            pathname: ['admin'],
            search: {queryMenu: 'open', docId: undefined},
            options: {}
        };

        it('Can move backward in history', () => {
            const adapter = new NativeSerializedStore();
            const subscription = jest.fn();
            adapter.subscribeToStateChanges(subscription);

            adapter.setState(locationOne);
            adapter.setState(locationTwo);
            adapter.setState(locationThree);
            adapter.setState(locationFour);

            expect(subscription.mock.calls[3][0]).toEqual(locationFour);
            expect(adapter.history).toHaveLength(4);

            adapter.back();

            expect(subscription.mock.calls[4][0]).toEqual(locationThree);
            expect(adapter.history).toHaveLength(4);

            adapter.back();

            expect(subscription.mock.calls[5][0]).toEqual(locationTwo);
            expect(adapter.history).toHaveLength(4);
        });

        it('Can jump in history', () => {
            const adapter = new NativeSerializedStore();
            const subscription = jest.fn();
            adapter.subscribeToStateChanges(subscription);

            adapter.setState(locationOne);
            adapter.setState(locationTwo);
            adapter.setState(locationThree);
            adapter.setState(locationFour);

            expect(subscription.mock.calls[3][0]).toEqual(locationFour);
            expect(adapter.history).toHaveLength(4);

            adapter.go(-3);

            expect(subscription.mock.calls[4][0]).toEqual(locationOne);
            expect(adapter.history).toHaveLength(4);

            adapter.go(2);

            expect(subscription.mock.calls[5][0]).toEqual(locationThree);
            expect(adapter.history).toHaveLength(4);
        });

        it('Moving is bounded to history scope', () => {
            const adapter = new NativeSerializedStore();
            const subscription = jest.fn();
            adapter.subscribeToStateChanges(subscription);

            adapter.setState(locationOne);
            adapter.setState(locationTwo);
            adapter.setState(locationThree);
            adapter.setState(locationFour);

            expect(subscription.mock.calls[3][0]).toEqual(locationFour);
            expect(adapter.history).toHaveLength(4);

            adapter.go(-30); // go too far in the past

            expect(subscription.mock.calls[4][0]).toEqual(locationOne);
            expect(adapter.history).toHaveLength(4);

            adapter.go(20); // go too far in the future

            expect(subscription.mock.calls[5][0]).toEqual(locationFour);
            expect(adapter.history).toHaveLength(4);
        });

        it('Can move forward in history', () => {
            const adapter = new NativeSerializedStore();
            const subscription = jest.fn();
            adapter.subscribeToStateChanges(subscription);

            adapter.setState(locationOne);
            adapter.setState(locationTwo);
            adapter.setState(locationThree);
            adapter.setState(locationFour);

            expect(subscription.mock.calls[3][0]).toEqual(locationFour);
            expect(adapter.history).toHaveLength(4);

            adapter.go(-30); // go to farthest recorded history

            expect(subscription.mock.calls[4][0]).toEqual(locationOne);
            expect(adapter.history).toHaveLength(4);

            adapter.forward(); // forward 1 in history

            expect(subscription.mock.calls[5][0]).toEqual(locationTwo);
            expect(adapter.history).toHaveLength(4);

            adapter.forward(); // forward 1 in history

            expect(subscription.mock.calls[6][0]).toEqual(locationThree);
            expect(adapter.history).toHaveLength(4);
        });
    });
});
