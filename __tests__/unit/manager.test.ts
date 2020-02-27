import Manager from '../../src/manager';
import {NativeSerializedStore, BrowserSerializedStore} from '../../src/serializedState';
import RouterStore from '../../src/routerState';
import {IRouterDeclaration} from '../../src/types';
import {DefaultTemplates} from '../../src/types/router_templates';

describe('Router Manager', () => {
    test('Requires all router names to be unique', () => {
        const tree = {
            name: 'root',
            routers: {
                scene: [
                    {
                        name: 'user',
                        routers: {
                            scene: [{name: 'user'}]
                        }
                    }
                ]
            }
        };
        expect(() => new Manager({routerTree: tree})).toThrow();
    });

    test('Requires all router routeKeys to be unique', () => {
        const tree = {
            name: 'root',
            routers: {
                scene: [
                    {
                        name: 'user',
                        routeKey: 'hello',
                        routers: {
                            scene: [{name: 'nextScene', routeKey: 'hello'}]
                        }
                    }
                ]
            }
        };
        expect(() => new Manager({routerTree: tree})).toThrow();
    });

    const routerTree = {
        name: 'root',
        routers: {
            scene: [
                {
                    name: 'user',
                    routers: {
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
            const manager = new Manager({routerTree});

            expect(Object.keys(manager.routers)).toHaveLength(7);
            expect(manager.rootRouter.name).toBe('root');
            expect(manager.routers['info'].name).toBe('info');
            expect(manager.routers['events'].parent.name).toBe('user');
            expect(manager.routers['root'].routers['scene']).toHaveLength(2);
        });

        describe('Serialized Store defaults', () => {
            describe('No window object (Non broser env)', () => {
                it('uses nativeStore', () => {
                    const manager = new Manager({routerTree});

                    expect(manager.serializedStateStore).toBeInstanceOf(NativeSerializedStore);
                });
            });

            describe('With window object (Browser env)', () => {
                it('uses browserStore', () => {
                    // eslint-disable-next-line
                    (global as any).window = {setInterval: jest.fn(), history: {}, location: {}};
                    const manager = new Manager({routerTree});

                    expect(manager.serializedStateStore).toBeInstanceOf(BrowserSerializedStore);

                    delete (global as any).window; // eslint-disable-line
                });
            });
        });
    });

    describe('Adding and removing routers', () => {
        describe('Initialized with routers', () => {
            const manager = new Manager({routerTree});

            it('then had a router added', () => {
                const newRouter: IRouterDeclaration<DefaultTemplates> = {
                    name: 'admin',
                    type: 'scene',
                    parentName: 'user'
                };

                manager.addRouter(newRouter);

                expect(Object.keys(manager.routers)).toHaveLength(8);
                expect(manager.routers['user'].routers.scene).toHaveLength(3);
                expect(manager.routers['admin'].name).toBe('admin');
                expect(manager.routers['admin'].parent).toBe(manager.routers['user']);
            });

            it('then had a router removed', () => {
                manager.removeRouter('admin');

                expect(Object.keys(manager.routers)).toHaveLength(7);
                expect(manager.routers['user'].routers.scene).toHaveLength(2);
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
                const manager = new Manager({routerTree});
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
                expect(testFnC.mock.calls).toHaveLength(1);

                manager.removeRouter('admin');

                const nextRoutersState = {
                    admin: {visible: true, order: 2},
                    user: {visible: false, order: 0}
                };

                manager.routerStateStore.setState(nextRoutersState);

                expect(testFnA.mock.calls).toHaveLength(1);
                expect(testFnB.mock.calls).toHaveLength(1);
                expect(testFnC.mock.calls).toHaveLength(2);
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
                expect(manager.routers['admin'].routers.feature).toHaveLength(1);
                expect(manager.routers['admin-tools'].name).toBe('admin-tools');
                expect(manager.routers['admin-tools'].parent).toBe(manager.routers['admin']);
            });
        });

        describe('Subscribing to a routers state', () => {
            const manager = new Manager({routerTree});

            it('issues state updates', () => {
                const userObserverFn = jest.fn();
                const secondUserObserverFn = jest.fn();
                const rootObserverFn = jest.fn();

                const initLocation = {pathname: ['user'], search: {}, options: {}};
                manager.serializedStateStore.setState(initLocation);

                manager.routers['user'].subscribe(userObserverFn);
                manager.routers['user'].subscribe(secondUserObserverFn);
                manager.routers['root'].subscribe(rootObserverFn);

                const nextLocation = {
                    pathname: ['test'],
                    search: {param1: '2', param2: 'testparam'},
                    options: {}
                };
                manager.serializedStateStore.setState(nextLocation);

                expect(userObserverFn.mock.calls[0][0]).toEqual({
                    current: {visible: false},
                    historical: [{visible: true}]
                });
                expect(userObserverFn.mock.calls).toHaveLength(1);

                expect(secondUserObserverFn.mock.calls[0][0]).toEqual({
                    current: {visible: false},
                    historical: [{visible: true}]
                });
                expect(secondUserObserverFn.mock.calls).toHaveLength(1);

                // root router shouldn't be called
                expect(rootObserverFn.mock.calls).toHaveLength(0);
            });
        });

        describe('Fetching a routers state', () => {
            const manager = new Manager({routerTree});

            it('returns the state for only the router', () => {
                const initialRoutersState = {
                    user: {visible: false, order: 1},
                    root: {visible: true, order: 22}
                };

                manager.routerStateStore.setState(initialRoutersState);

                expect(manager.routers['user'].getState()).toEqual({
                    current: {visible: false, order: 1},
                    historical: []
                });
            });
        });
    });
});
