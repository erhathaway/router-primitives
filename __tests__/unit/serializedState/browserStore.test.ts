import {BrowserSerializedStore} from '../../../src/serialized_state';

declare global {
    // eslint-disable-next-line
    namespace NodeJS {
        interface Global {
            document: Document;
            window: {
                setInterval: jest.Mock;
                history: {pushState: jest.Mock; replaceState: jest.Mock};
                location: object;
            };
            navigator: Navigator;
        }
    }
}

// jest.mock('global', () => ({}));
beforeAll(() => {
    global.window = {
        history: {pushState: jest.fn(), replaceState: jest.fn()},
        location: {},
        setInterval: jest.fn()
    };
});

afterAll(() => {
    delete global.window;
});

describe('Browser Serialized State', () => {
    describe('Store', () => {
        test('Setting state can mutate history ', () => {
            window.setInterval = jest.fn();
            window.history.replaceState = jest.fn();
            window.history.pushState = jest.fn();

            const store = new BrowserSerializedStore();

            const location = {
                pathname: ['test'],
                search: {param1: '2', param2: 'testparam'},
                options: {}
            };

            expect(window.history.pushState).not.toBeCalled();
            store.setState(location);
            expect(window.history.pushState).toBeCalled();
            store.cleanUp();
        });

        test('Setting state can preserve history by replacing current state', () => {
            window.setInterval = jest.fn();
            window.history.pushState = jest.fn();
            window.history.replaceState = jest.fn();

            const store = new BrowserSerializedStore();

            const location = {
                pathname: ['test'],
                search: {param1: '2', param2: 'testparam'},
                options: {replaceLocation: true}
            };

            expect(window.history.replaceState).not.toBeCalled();
            store.setState(location);
            expect(window.history.replaceState).toBeCalled();
            store.cleanUp();
        });

        test('Can observe store state changes', () => {
            window.setInterval = jest.fn();
            window.history.pushState = jest.fn();
            window.history.replaceState = jest.fn();

            const store = new BrowserSerializedStore();

            const subscriptionOne = jest.fn();
            const subscriptionTwo = jest.fn();

            store.subscribeToStateChanges(subscriptionOne);
            const stateOne = {
                pathname: ['newState'],
                search: {param1: '2', param2: 'testparam'}
            };

            window.location.search = '?param1=2&param2=testparam';
            window.location.pathname = 'newState/';
            store.setState(stateOne);

            store.subscribeToStateChanges(subscriptionTwo);
            const stateTwo = {
                pathname: ['newStateOther'],
                search: {param1: '3', param2: undefined}
            };

            window.location.search = '?param1=3';
            window.location.pathname = 'newStateOther';
            store.setState(stateTwo);

            // called three times: on subscribe, setState 1, setState 2
            expect(subscriptionOne.mock.calls).toHaveLength(3);
            expect(subscriptionOne.mock.calls[1][0]).toEqual(stateOne);
            expect(subscriptionOne.mock.calls[2][0]).toEqual(stateTwo);

            expect(subscriptionTwo.mock.calls).toHaveLength(2);
            expect(subscriptionTwo.mock.calls[1][0]).toEqual(stateTwo);
            store.cleanUp();
        });

        test('Can unsubscribe from store state changes', () => {
            window.setInterval = jest.fn();
            window.history.pushState = jest.fn();
            window.history.replaceState = jest.fn();

            const store = new BrowserSerializedStore();
            const testFnA = jest.fn();
            const testFnB = jest.fn();
            const testFnC = jest.fn();

            store.subscribeToStateChanges(testFnA);
            store.subscribeToStateChanges(testFnB);
            store.subscribeToStateChanges(testFnC);

            const state = {pathname: ['newState'], search: {}, options: {}};
            store.setState(state);

            expect(testFnA.mock.calls).toHaveLength(2);
            expect(testFnB.mock.calls).toHaveLength(2);
            expect(testFnC.mock.calls).toHaveLength(2);

            store.unsubscribeFromStateChanges(testFnA);

            const nextState = {pathname: ['newState'], search: {update: 'yest'}, options: {}};
            store.setState(nextState);

            expect(testFnA.mock.calls).toHaveLength(2);
            expect(testFnB.mock.calls).toHaveLength(3);
            expect(testFnC.mock.calls).toHaveLength(3);
            store.cleanUp();
        });

        // test('Observers are notified if the URL is updated outside the router', () => {
        //   // window.setInterval = jest.fn();
        //   window.history.pushState = jest.fn();
        //   window.history.replaceState = jest.fn();
        //   window.location.setInterval = setInterval;

        //   const store = new BrowserSerializedStore();

        //   const subscriptionOne = jest.fn();
        //   const subscriptionTwo = jest.fn();

        //   store.subscribeToStateChanges(subscriptionOne);
        //   const stateOne = { pathname: ['newState'], search: { param1: '2', param2: 'testparam'}, options: {}}
        //   window.location.search  = '?param1=2&param2=testparam';
        //   window.location.pathname = 'newState/';
        //   window.location.href = 'newState?param1=2&param2=testparam';

        //   store.subscribeToStateChanges(subscriptionTwo);
        //   const stateTwo = { pathname: ['newStateOther'], search: { param1: '3', param2: undefined }, options: {}}
        //   window.location.search  = '?param1=3';
        //   window.location.pathname = 'newStateOther';
        //   window.location.href = 'newStateOther?param1=3';

        //   expect(subscriptionOne.mock.calls.length).toBe(2);
        //   expect(subscriptionOne.mock.calls[0][0]).toEqual(stateOne);
        //   expect(subscriptionOne.mock.calls[1][0]).toEqual(stateTwo);

        //   expect(subscriptionTwo.mock.calls.length).toBe(1);
        //   expect(subscriptionTwo.mock.calls[0][0]).toEqual(stateTwo);
        // })
    });

    describe('History', () => {
        // eslint-disable-next-line
        (global as any).window = {}; // TODO Figure out why this is required?? The beforeAll should take care of it, but doesn't
        window.setInterval = jest.fn();
        // window.history.pushState = jest.fn();
        // window.history.replaceState = jest.fn();
        const store = new BrowserSerializedStore();
        afterAll(() => {
            store.cleanUp();
        });

        it('Can move forward', () => {
            window.history.forward = jest.fn();

            expect(window.history.forward).not.toBeCalled();
            store.forward();
            expect(window.history.forward).toBeCalled();
        });

        it('Can move backward', () => {
            window.history.back = jest.fn();

            expect(window.history.back).not.toBeCalled();
            store.back();
            expect(window.history.back).toBeCalled();
        });

        it('Can move to a specific point in history', () => {
            window.history.go = jest.fn();

            expect(window.history.go).not.toBeCalledWith(-1);
            store.go(-1);
            expect(window.history.go).toBeCalledWith(-1);
        });
    });
});
