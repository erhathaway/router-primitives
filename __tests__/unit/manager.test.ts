import Manager from '../../src/manager';
import {NativeSerializedStore, BrowserSerializedStore} from '../../src/serialized_state';
import RouterStore from '../../src/all_router_state';
import {IRouterDeclaration, AllTemplates} from '../../src/types';
import {DefaultTemplates} from '../../src/types/router_templates';

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

describe('Router Manager', () => {
    test('Requires all router names to be unique', () => {
        const tree: IRouterDeclaration<AllTemplates> = {
            name: 'root',
            children: {
                scene: [
                    {
                        name: 'user',
                        children: {
                            scene: [{name: 'user'}]
                        }
                    }
                ]
            }
        };
        expect(() => new Manager({routerDeclaration: tree})).toThrow();
    });

    test('Requires all router routeKeys to be unique', () => {
        const tree: IRouterDeclaration<AllTemplates> = {
            name: 'root',
            children: {
                scene: [
                    {
                        name: 'user',
                        routeKey: 'hello',
                        children: {
                            scene: [{name: 'nextScene', routeKey: 'hello'}]
                        }
                    }
                ]
            }
        };
        expect(() => new Manager({routerDeclaration: tree})).toThrow();
    });

    const routerDeclaration: IRouterDeclaration<AllTemplates> = {
        name: 'root',
        children: {
            scene: [
                {
                    name: 'user',
                    children: {
                        scene: [{name: 'events'}, {name: 'details'}]
                    }
                },
                {name: 'info'}
            ],
            feature: [{name: 'toolbar'}],
            stack: [{name: 'notification-modal'}]
        }
    };

    describe('Initialization', () => {
        test('Defaults to serialized and router stores', () => {
            const manager = new Manager();

            expect(manager.serializedStateStore).toBeInstanceOf(NativeSerializedStore);
            expect(manager.routerStateStore).toBeInstanceOf(RouterStore);
        });

        test('Can add a router tree', () => {
            const manager = new Manager({routerDeclaration});

            expect(Object.keys(manager.routers)).toHaveLength(7);
            expect(manager.rootRouter.name).toBe('root');
            expect(manager.routers['info'].name).toBe('info');
            expect(manager.routers['events'].parent.name).toBe('user');
            expect(manager.routers['root'].children['scene']).toHaveLength(2);
        });

        describe('Serialized Store defaults', () => {
            describe('No window object (Non browser env)', () => {
                it('uses nativeStore', () => {
                    const manager = new Manager({routerDeclaration});

                    expect(manager.serializedStateStore).toBeInstanceOf(NativeSerializedStore);
                });
            });

            describe('With window object (Browser env)', () => {
                it('uses browserStore', () => {
                    // eslint-disable-next-line
                    const setIntervalFn = jest.fn();
                    global.window = {
                        setInterval: setIntervalFn,
                        history: {pushState: jest.fn(), replaceState: jest.fn()},
                        location: {}
                    };
                    const manager = new Manager({routerDeclaration});
                    setIntervalFn();
                    expect(manager.serializedStateStore).toBeInstanceOf(BrowserSerializedStore);

                    expect(setIntervalFn).toBeCalled();

                    // cleanup setIntervalFn
                    (manager.serializedStateStore as BrowserSerializedStore).cleanUp();

                    delete (global as any).window; // eslint-disable-line
                });
            });
        });
    });

    describe('Adding and removing routers', () => {
        describe('Initialized with routers', () => {
            const manager = new Manager({routerDeclaration});

            it('then had a router added', () => {
                const newRouter: IRouterDeclaration<DefaultTemplates> = {
                    name: 'admin',
                    type: 'scene',
                    parentName: 'user'
                };

                manager.addRouter(newRouter);

                expect(Object.keys(manager.routers)).toHaveLength(8);
                expect(manager.routers['user'].children.scene).toHaveLength(3);
                expect(manager.routers['admin'].name).toBe('admin');
                expect(manager.routers['admin'].parent).toBe(manager.routers['user']);
            });

            it('then had a router removed', () => {
                manager.removeRouter('admin');

                expect(Object.keys(manager.routers)).toHaveLength(7);
                expect(manager.routers['user'].children.scene).toHaveLength(2);
                expect(manager.routers['admin']).toBe(undefined);
            });

            it('had a router with child routers removed', () => {
                expect(manager.routers['events'].name).toBe('events');
                expect(manager.routers['details'].name).toBe('details');

                manager.removeRouter('user');

                expect(Object.keys(manager.routers)).toHaveLength(4);
                expect(manager.routers['user']).toBe(undefined);
                expect(manager.routers['events']).toBe(undefined);
                expect(manager.routers['details']).toBe(undefined);
            });
        });

        describe('Removing a router with state observers', () => {
            it('cleans up observers', () => {
                const manager = new Manager({routerDeclaration});
                const newRouter: IRouterDeclaration<DefaultTemplates> = {
                    name: 'admin',
                    type: 'scene',
                    parentName: 'user'
                };

                manager.addRouter(newRouter);

                const testFnA = jest.fn();
                const testFnB = jest.fn();
                const testFnC = jest.fn();

                manager.routers['admin'].subscribe(testFnA);
                manager.routers['admin'].subscribe(testFnB);
                manager.routers['user'].subscribe(testFnC);

                const initialRoutersState = {
                    admin: {visible: false, order: 1},
                    user: {visible: true, order: 22}
                };

                manager.routerStateStore.setState(initialRoutersState);

                expect(testFnA.mock.calls).toHaveLength(1);
                expect(testFnB.mock.calls).toHaveLength(1);
                // has length of 2 b/c it was around during router tree init
                // so it has a starting state
                expect(testFnC.mock.calls).toHaveLength(2);

                manager.removeRouter('admin');

                const nextRoutersState = {
                    admin: {visible: true, order: 2},
                    user: {visible: false, order: 0}
                };

                manager.routerStateStore.setState(nextRoutersState);

                expect(testFnA.mock.calls).toHaveLength(1);
                expect(testFnB.mock.calls).toHaveLength(1);
                expect(testFnC.mock.calls).toHaveLength(3);
            });
        });

        describe('Not initialized with routers', () => {
            const manager = new Manager();

            it('had one router added', () => {
                expect(Object.keys(manager.routers)).toHaveLength(0);

                const newRouter = {
                    name: 'admin'
                };

                manager.addRouter(newRouter);

                expect(Object.keys(manager.routers)).toHaveLength(1);
                expect(manager.rootRouter.name).toBe('admin');
            });

            it('had two routers added', () => {
                const newRouter: IRouterDeclaration<DefaultTemplates> = {
                    name: 'admin-tools',
                    parentName: 'admin',
                    type: 'feature'
                };

                manager.addRouter(newRouter);

                expect(Object.keys(manager.routers)).toHaveLength(2);
                expect(manager.routers['admin'].children.feature).toHaveLength(1);
                expect(manager.routers['admin-tools'].name).toBe('admin-tools');
                expect(manager.routers['admin-tools'].parent).toBe(manager.routers['admin']);
            });
        });

        describe('Subscribing to a routers state', () => {
            const manager = new Manager({routerDeclaration});

            it('issues state updates', () => {
                const userObserverFn = jest.fn();
                const secondUserObserverFn = jest.fn();
                const rootObserverFn = jest.fn();

                manager.routers['user'].subscribe(userObserverFn);
                const initLocation = {pathname: ['user'], search: {}, options: {}};
                manager.serializedStateStore.setState(initLocation);

                manager.routers['user'].subscribe(secondUserObserverFn);
                manager.routers['root'].subscribe(rootObserverFn);

                // expect to have a historical state from not being visible on startup
                expect(userObserverFn.mock.calls[1][0]).toEqual({
                    current: {visible: true, actionCount: 3},
                    historical: [{visible: false, actionCount: 1}]
                });

                const nextLocation = {
                    pathname: ['test'],
                    search: {param1: '2', param2: 'testparam'},
                    options: {}
                };
                manager.serializedStateStore.setState(nextLocation);

                expect(userObserverFn.mock.calls[2][0]).toEqual({
                    current: {visible: false, actionCount: 4},
                    historical: [
                        {visible: true, actionCount: 3},
                        {visible: false, actionCount: 1}
                    ]
                });
                expect(userObserverFn.mock.calls).toHaveLength(3);

                expect(secondUserObserverFn.mock.calls[1][0]).toEqual({
                    current: {visible: false, actionCount: 4},
                    historical: [
                        {visible: true, actionCount: 3},
                        {visible: false, actionCount: 1}
                    ]
                });
                expect(secondUserObserverFn.mock.calls).toHaveLength(2);

                // root router shouldn't be called
                expect(rootObserverFn.mock.calls).toHaveLength(1);
            });
        });

        describe('Fetching a routers state', () => {
            const manager = new Manager({routerDeclaration});

            it('returns the state for only the router', () => {
                const initialRoutersState = {
                    user: {visible: false},
                    root: {visible: true, data: 22},
                    'notification-modal': {visible: false, data: 1}
                };

                manager.routerStateStore.setState(initialRoutersState);

                expect(manager.routers['user'].getState()).toEqual({
                    current: {visible: false, actionCount: 1},
                    historical: []
                });

                // notification modal has a history b/c the new set state has an order
                // whereas on startup, the order was implicitly undefined b/c no defaultAction
                // gave it an order
                expect(manager.routers['notification-modal'].getState()).toEqual({
                    current: {visible: false, data: 1},
                    historical: [{visible: false, data: undefined, actionCount: 1}]
                });
            });
        });
    });
});
