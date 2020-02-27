import RouterStateStore from '../../src/routerState';
import {RouterCurrentState} from '../../src/types';

describe('Router State', () => {
    describe('Adapter', () => {
        test('Uses a default object store', () => {
            const store = new RouterStateStore();
            expect(store.getState()).toEqual({});
        });

        test('Can write to store', () => {
            const defaultState = {};
            const store = new RouterStateStore(defaultState);

            const rootState = {visible: true, order: 0};
            const firstSceneState = {visible: false, flow: 'wild'};
            const routers = {
                root: rootState,
                firstScene: firstSceneState
            };

            store.setState(routers);
            expect(store.getState()).toEqual({
                root: {current: rootState, historical: []},
                firstScene: {current: firstSceneState, historical: []}
            });
        });

        test('Can unsubscribe a single router that doesnt exist without causing an error', () => {
            const defaultState = {};
            const TEST_ROUTER_A = 'TEST_ROUTER_A';
            const store = new RouterStateStore(defaultState);
            store.unsubscribeAllObserversForRouter(TEST_ROUTER_A);
        });

        test('Can unsubscribe all observers for a router that doesnt exist without causing an error', () => {
            const defaultState = {};
            const TEST_ROUTER_A = 'TEST_ROUTER_A';
            const store = new RouterStateStore(defaultState);
            const unsubscribeer = store.createRouterStateUnsubscriber(TEST_ROUTER_A);

            const testFnA = jest.fn();

            unsubscribeer(testFnA);
        });

        test('Can unsubscribe all observers from store for a given router', () => {
            const defaultState = {};

            const TEST_ROUTER_A = 'TEST_ROUTER_A';
            const TEST_ROUTER_B = 'TEST_ROUTER_B';

            const store = new RouterStateStore(defaultState);

            const subscriberA = store.createRouterStateSubscriber(TEST_ROUTER_A);
            const subscriberB = store.createRouterStateSubscriber(TEST_ROUTER_B);

            const testFnA = jest.fn();
            const testFnB = jest.fn();
            const testFnC = jest.fn();
            const testFnD = jest.fn();

            subscriberA(testFnA);
            subscriberA(testFnB);
            subscriberB(testFnC);
            subscriberB(testFnD);

            const routerStateOne = {visible: true, order: 0};
            const newState = {} as Record<string, RouterCurrentState>;
            newState[TEST_ROUTER_A] = routerStateOne;
            newState[TEST_ROUTER_B] = routerStateOne;

            store.setState(newState);

            expect(testFnA.mock.calls).toHaveLength(1);
            expect(testFnB.mock.calls).toHaveLength(1);
            expect(testFnC.mock.calls).toHaveLength(1);
            expect(testFnD.mock.calls).toHaveLength(1);

            store.unsubscribeAllObserversForRouter(TEST_ROUTER_A);

            const routerStateTwo = {visible: false, order: 1};
            const anotherNewState = {} as Record<string, RouterCurrentState>;
            anotherNewState[TEST_ROUTER_A] = routerStateTwo;
            anotherNewState[TEST_ROUTER_B] = routerStateTwo;

            store.setState(anotherNewState);

            expect(testFnA.mock.calls).toHaveLength(1);
            expect(testFnB.mock.calls).toHaveLength(1);
            expect(testFnC.mock.calls).toHaveLength(2);
            expect(testFnD.mock.calls).toHaveLength(2);
        });

        test('Can unsubscribe single observers from store for a given router', () => {
            const defaultState = {};

            const TEST_ROUTER_A = 'TEST_ROUTER_A';
            const store = new RouterStateStore(defaultState);
            const subscriber = store.createRouterStateSubscriber(TEST_ROUTER_A);
            const unsubscriber = store.createRouterStateUnsubscriber(TEST_ROUTER_A);

            const testFnA = jest.fn();
            const testFnB = jest.fn();
            subscriber(testFnA);
            subscriber(testFnB);

            const routerStateOne = {visible: true, order: 0};
            const newState = {} as Record<string, RouterCurrentState>;
            newState[TEST_ROUTER_A] = routerStateOne;

            store.setState(newState);

            expect(testFnA.mock.calls).toHaveLength(1);
            expect(testFnB.mock.calls).toHaveLength(1);

            unsubscriber(testFnA);

            const routerStateTwo = {visible: false, order: 1};
            const anotherNewState = {} as Record<string, RouterCurrentState>;
            anotherNewState[TEST_ROUTER_A] = routerStateTwo;

            store.setState(anotherNewState);

            expect(testFnA.mock.calls).toHaveLength(1);
            expect(testFnB.mock.calls).toHaveLength(2);
        });

        test('Can store history', () => {
            const defaultState = {};
            const store = new RouterStateStore(defaultState);

            const rootStateOne = {visible: true, order: 0};
            const rootStateTwo = {visible: false, order: 1};

            const firstSceneStateOne = {visible: false, flow: 'wild'};
            const firstSceneStateTwo = {visible: true, flow: 'calm'};

            store.setState({
                root: rootStateOne,
                firstScene: firstSceneStateOne
            });

            store.setState({
                root: rootStateTwo,
                firstScene: firstSceneStateTwo
            });

            expect(store.getState()).toEqual({
                root: {current: rootStateTwo, historical: [rootStateOne]},
                firstScene: {current: firstSceneStateTwo, historical: [firstSceneStateOne]}
            });
        });

        test('Can set and maintain history size', () => {
            const defaultState = {};
            const store = new RouterStateStore(defaultState, {historySize: 3});

            [1, 2, 3, 4, 5, 6].forEach(order => {
                store.setState({root: {visible: true, order}} as Record<
                    string,
                    RouterCurrentState<{order: number}>
                >);
            });

            expect(store.getState()).toEqual({
                root: {
                    current: {visible: true, order: 6},
                    historical: [
                        {visible: true, order: 5},
                        {visible: true, order: 4},
                        {visible: true, order: 3}
                    ]
                }
            });
        });

        test('Can can create individaul router state subscribers', () => {
            const defaultState = {};
            const store = new RouterStateStore(defaultState);
            const ownerObserver = jest.fn();
            const ownerSubjectSubscriber = store.createRouterStateSubscriber('owner-router');
            ownerSubjectSubscriber(ownerObserver);

            const infoObserver = jest.fn();
            const infoSubjectSubscriber = store.createRouterStateSubscriber('info-router');
            infoSubjectSubscriber(infoObserver);

            // set two different router states
            store.setState({
                'owner-router': {visible: true},
                'info-router': {visible: false}
            });

            expect(ownerObserver.mock.calls[0][0]).toEqual({
                current: {visible: true},
                historical: []
            });
            expect(infoObserver.mock.calls[0][0]).toEqual({
                current: {visible: false},
                historical: []
            });

            // set one router state
            store.setState({
                'info-router': {visible: true}
            });

            expect(ownerObserver.mock.calls[0][0]).toEqual({
                current: {visible: true},
                historical: []
            });
            expect(ownerObserver.mock.calls).toHaveLength(1);

            expect(infoObserver.mock.calls[1][0]).toEqual({
                current: {visible: true},
                historical: [{visible: false}]
            });
            expect(infoObserver.mock.calls).toHaveLength(2);

            // set the other router state
            store.setState({
                'owner-router': {visible: false}
            });

            expect(ownerObserver.mock.calls[1][0]).toEqual({
                current: {visible: false},
                historical: [{visible: true}]
            });
            expect(ownerObserver.mock.calls).toHaveLength(2);

            expect(infoObserver.mock.calls[1][0]).toEqual({
                current: {visible: true},
                historical: [{visible: false}]
            });
            expect(infoObserver.mock.calls).toHaveLength(2);
        });

        test('Can create individual router state getters', () => {
            const defaultState = {};
            const store = new RouterStateStore(defaultState);
            const ownerGetter = store.createRouterStateGetter('owner-router');
            const infoGetter = store.createRouterStateGetter('info-router');

            // set two different router states
            store.setState({
                'owner-router': {visible: true},
                'info-router': {visible: false}
            });

            expect(ownerGetter()).toEqual({current: {visible: true}, historical: []});
            expect(infoGetter()).toEqual({current: {visible: false}, historical: []});

            // set one router state
            store.setState({
                'info-router': {visible: true}
            });

            expect(ownerGetter()).toEqual({current: {visible: true}, historical: []});
            expect(infoGetter()).toEqual({
                current: {visible: true},
                historical: [{visible: false}]
            });
        });
    });
});
