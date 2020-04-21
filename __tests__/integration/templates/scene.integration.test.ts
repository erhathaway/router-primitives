import {
    Manager,
    AllTemplates,
    IRouterDeclaration,
    isMemorySerializedStateStore,
    NativeSerializedStore,
    ISerializedStateStore
} from '../../../src';

describe('Integration', () => {
    const routerTreeForDefaultShowTest: IRouterDeclaration<AllTemplates> = {
        name: 'root',
        children: {
            scene: [
                {
                    name: 'user', // pathRouter scene
                    children: {
                        scene: [{name: 'events', defaultAction: ['show']}, {name: 'details'}]
                    }
                },
                {name: 'info'}
            ],
            feature: [
                {
                    name: 'toolbar',
                    children: {
                        scene: [
                            {name: 'main-tools'}, // non-pathRouter scene
                            {
                                name: 'side-tools',
                                defaultAction: ['show'],
                                children: {
                                    feature: [{name: 'side-tools-menu', defaultAction: ['show']}]
                                }
                            }
                        ]
                    }
                }
            ],
            stack: [{name: 'notification-modal', routeKey: 'short'}]
        }
    };

    describe('Scene template', () => {
        describe('Actions', () => {
            it('Can have replace location action option set', () => {
                const manager = new Manager({routerDeclaration: routerTreeForDefaultShowTest});
                const serializedStateStore = manager.serializedStateStore as NativeSerializedStore;
                if (!isMemorySerializedStateStore(serializedStateStore)) {
                    throw Error(
                        `Wrong store type: ${(serializedStateStore as ISerializedStateStore).kind}`
                    );
                }
                const userRouter = manager.routers['user'];
                const eventsRouter = manager.routers['events'];

                userRouter.show();
                expect(serializedStateStore.history).toHaveLength(2);

                eventsRouter.show({replaceLocation: true});

                expect(serializedStateStore.history).toHaveLength(2);

                eventsRouter.hide({replaceLocation: true});

                expect(serializedStateStore.history).toHaveLength(2);

                eventsRouter.show();

                expect(serializedStateStore.history).toHaveLength(3);

                eventsRouter.hide({replaceLocation: false});

                expect(serializedStateStore.history).toHaveLength(4);
            });
            describe('Show', () => {
                const manager = new Manager({routerDeclaration: routerTreeForDefaultShowTest});

                const userObserver = jest.fn();
                const userRouter = manager.routers['user'];
                userRouter.subscribe(userObserver);

                const toolbarObserver = jest.fn();
                const toolbarRouter = manager.routers['toolbar'];
                toolbarRouter.subscribe(toolbarObserver);

                const mainToolsObserver = jest.fn();
                const mainToolsRouter = manager.routers['main-tools'];
                mainToolsRouter.subscribe(mainToolsObserver);

                it('PathRouter child of rootRouter', () => {
                    userRouter.show();
                    userRouter.show();

                    expect(userRouter.isPathRouter).toBe(true);

                    // subscribing returns the initial state
                    expect(userObserver.mock.calls[0][0]).toEqual({
                        current: {visible: false, actionCount: 1},
                        historical: []
                    });

                    // showing makes the router visible
                    expect(userObserver.mock.calls[1][0]).toEqual({
                        current: {visible: true, actionCount: 3},
                        historical: [{visible: false, actionCount: 1}]
                    });

                    // second action call should do nothing since its identical to the first
                    expect(userObserver.mock.calls[2]).toBe(undefined);
                });

                it('On non pathRouter child of rootRouter', () => {
                    toolbarRouter.show();
                    mainToolsRouter.show();
                    mainToolsRouter.show();

                    expect(mainToolsRouter.isPathRouter).toBe(false);

                    // subscribing returns the initial state
                    expect(userObserver.mock.calls[0][0]).toEqual({
                        current: {visible: false, actionCount: 1},
                        historical: []
                    });

                    // showing makes the router visible
                    expect(mainToolsObserver.mock.calls[1][0]).toEqual({
                        current: {visible: true, actionCount: 6},
                        historical: [{visible: false, actionCount: 1}]
                    });

                    // only two state update should have been made for this router
                    expect(mainToolsObserver.mock.calls).toHaveLength(2);
                });
            });

            describe('Hide', () => {
                const manager = new Manager({routerDeclaration: routerTreeForDefaultShowTest});

                const userObserver = jest.fn();
                const userRouter = manager.routers['user'];
                userRouter.subscribe(userObserver);

                const toolbarObserver = jest.fn();
                const toolbarRouter = manager.routers['toolbar'];
                toolbarRouter.subscribe(toolbarObserver);

                const mainToolsObserver = jest.fn();
                const mainToolsRouter = manager.routers['main-tools'];
                mainToolsRouter.subscribe(mainToolsObserver);

                it('PathRouter child of rootRouter', () => {
                    userRouter.show();

                    expect(userRouter.isPathRouter).toBe(true);
                    expect(userRouter.state.visible).toBe(true);

                    userRouter.hide();

                    expect(userRouter.state.visible).toBe(false);
                    expect(userObserver.mock.calls[2][0]).toEqual({
                        current: {visible: false, actionCount: 4},
                        historical: [
                            {visible: true, actionCount: 3},
                            {visible: false, actionCount: 1}
                        ]
                    });
                });

                it('On non pathRouter child of rootRouter', () => {
                    mainToolsRouter.show();

                    expect(mainToolsRouter.isPathRouter).toBe(false);
                    expect(mainToolsRouter.state.visible).toBe(true);

                    mainToolsRouter.hide();

                    expect(mainToolsRouter.state.visible).toBe(false);
                    expect(mainToolsObserver.mock.calls[2][0]).toEqual({
                        current: {visible: false, actionCount: 6},
                        historical: [
                            {visible: true, actionCount: 5},
                            {visible: false, actionCount: 1}
                        ]
                    });
                });
            });
        });
    });

    describe('View Defaults', () => {
        const manager = new Manager({routerDeclaration: routerTreeForDefaultShowTest});

        it('Are set when a parent router is called', () => {
            const userObserver = jest.fn();
            const userRouter = manager.routers['user'];
            userRouter.subscribe(userObserver);

            const eventsObserver = jest.fn();
            const eventsRouter = manager.routers['events'];
            eventsRouter.subscribe(eventsObserver);

            expect(eventsObserver.mock.calls[0][0].current).toEqual({
                visible: false,
                actionCount: 1
            });

            userRouter.show();

            expect(manager.routers['info'].state.visible).toBe(false);
            expect(manager.routers['events'].state.visible).toBe(true);
            expect(eventsObserver.mock.calls[1][0]).toEqual({
                current: {visible: true, actionCount: 3},
                historical: [{visible: false, actionCount: 1}]
            });
        });

        it('All default children are shown', () => {
            const toolbarObserver = jest.fn();
            const toolbarRouter = manager.routers['toolbar'];
            toolbarRouter.subscribe(toolbarObserver);

            const sideToolsObserver = jest.fn();
            const sideToolsRouter = manager.routers['side-tools'];
            sideToolsRouter.subscribe(sideToolsObserver);

            const sideToolsMenuObserver = jest.fn();
            const sideToolsMenuRouter = manager.routers['side-tools-menu'];
            sideToolsMenuRouter.subscribe(sideToolsMenuObserver);

            expect(sideToolsRouter.state.visible).toEqual(false);
            expect(sideToolsMenuRouter.state.visible).toEqual(false);

            toolbarRouter.show();

            expect(manager.routers['main-tools'].state.visible).toBe(false);
            expect(sideToolsObserver.mock.calls[1][0].current).toEqual({
                visible: true,
                actionCount: 4
            });
            expect(sideToolsMenuObserver.mock.calls[1][0].current).toEqual({
                visible: true,
                actionCount: 4
            });
        });
    });

    describe('Caching', () => {
        const routerTreeForCacheTest: IRouterDeclaration<AllTemplates> = {
            name: 'root',
            children: {
                scene: [{name: 'user'}],
                feature: [
                    {
                        name: 'toolbar',
                        children: {
                            scene: [
                                {name: 'main-tools'}, // non-pathRouter scene
                                {
                                    name: 'side-tools',
                                    defaultAction: ['show'],
                                    disableCaching: true, // disable caching
                                    children: {
                                        feature: [
                                            {
                                                name: 'side-tools-menu',
                                                defaultAction: ['show'],
                                                children: {
                                                    scene: [
                                                        {
                                                            name: 'side-tools-menu-scene',
                                                            disableCaching: false, // enable caching
                                                            children: {
                                                                scene: [
                                                                    {
                                                                        name: 'final-router'
                                                                    }
                                                                ]
                                                            }
                                                        }
                                                    ]
                                                }
                                            }
                                        ]
                                    }
                                }
                            ]
                        }
                    }
                ],
                stack: [{name: 'notification-modal', routeKey: 'short'}]
            }
        };

        it('Caching of children on hide', () => {
            const manager = new Manager({routerDeclaration: routerTreeForCacheTest});

            // caches children but avoids children between disable cache levels
            expect(manager.routerCache.cache['side-tools']).toBe(undefined);
            expect(manager.routerCache.cache['side-tools-menu']).toBe(undefined);
            expect(manager.routerCache.cache['side-tools-menu-scene']).toBe(undefined);
            expect(manager.routerCache.cache['final-router']).toBe(undefined);

            manager.routers['toolbar'].show();

            expect(manager.routers['side-tools'].state.visible).toBe(true);
            expect(manager.routers['side-tools-menu'].state.visible).toBe(true);
            expect(manager.routers['side-tools-menu-scene'].state.visible).toBe(false);
            expect(manager.routers['final-router'].state.visible).toBe(false);

            manager.routers['side-tools-menu-scene'].show();
            manager.routers['final-router'].show();

            expect(manager.routerCache.cache['side-tools']).toBe(undefined);
            expect(manager.routerCache.cache['side-tools-menu']).toBe(undefined);
            expect(manager.routerCache.cache['side-tools-menu-scene']).toBe(undefined);
            expect(manager.routerCache.cache['final-router']).toBe(undefined);

            expect(manager.routers['side-tools-menu'].state.visible).toBe(true);
            expect(manager.routers['side-tools-menu-scene'].state.visible).toBe(true);
            expect(manager.routers['final-router'].state.visible).toBe(true);

            manager.routers['toolbar'].hide();

            // has cache
            expect(manager.routerCache.cache['side-tools']).toBe(undefined); // disables cache
            expect(manager.routerCache.cache['side-tools-menu']).toBe(undefined); // inherits disabled cache
            expect(manager.routerCache.cache['side-tools-menu-scene'].visible).toBe(true); // enables cache
            expect(manager.routerCache.cache['final-router'].visible).toBe(true);

            expect(manager.routers['side-tools'].state.visible).toBe(false);
            expect(manager.routers['side-tools-menu'].state.visible).toBe(false);
            expect(manager.routers['side-tools-menu-scene'].state.visible).toBe(false);
            expect(manager.routers['final-router'].state.visible).toBe(false);

            manager.routers['toolbar'].show();

            expect(manager.routers['side-tools'].state.visible).toBe(true); // b/c default action
            expect(manager.routers['side-tools-menu'].state.visible).toBe(true); // b/c default action
            expect(manager.routers['side-tools-menu-scene'].state.visible).toBe(true); // b/c cache
            expect(manager.routers['final-router'].state.visible).toBe(true); // b/c cache
        });

        it('uses cache to restore visibility', () => {
            const manager = new Manager({routerDeclaration: routerTreeForCacheTest});

            manager.routers['final-router'].show();

            expect(manager.routers['side-tools-menu'].state.visible).toBe(true); // child was shown
            expect(manager.routers['side-tools-menu-scene'].state.visible).toBe(true); // child was shown
            expect(manager.routers['final-router'].state.visible).toBe(true); // caller of show action

            expect(manager.routerCache.cache['side-tools-menu']).toBe(undefined);
            expect(manager.routerCache.cache['side-tools-menu-scene']).toBe(undefined);
            expect(manager.routerCache.cache['final-router']).toBe(undefined);

            manager.routers['side-tools-menu'].hide();

            expect(manager.routerCache.cache['side-tools-menu']).toBe(undefined); // inherits disabled cache
            expect(manager.routerCache.cache['side-tools-menu-scene'].visible).toBe(true); // enables cache
            expect(manager.routerCache.cache['final-router'].visible).toBe(true); // inherits enabled cache

            manager.routers['side-tools'].hide();

            expect(manager.routerCache.cache['side-tools']).toBe(undefined); // disables cache
            expect(manager.routerCache.cache['side-tools-menu']).toBe(undefined); // inherits disabled cache
            expect(manager.routerCache.cache['side-tools-menu-scene'].visible).toBe(true); // enables cache and was previously visible
            expect(manager.routerCache.cache['final-router'].visible).toBe(true); // inherits enabled cache and was previously visible

            manager.routers['side-tools'].show();

            expect(manager.routers['side-tools-menu'].state.visible).toBe(true);
            expect(manager.routers['side-tools-menu-scene'].state.visible).toBe(true);
            expect(manager.routers['final-router'].state.visible).toBe(true);

            manager.routers['side-tools-menu-scene'].hide();

            expect(manager.routerCache.cache['side-tools']).toBe(undefined); // disables cache
            expect(manager.routerCache.cache['side-tools-menu']).toBe(undefined); // inherits disabled cache
            expect(manager.routerCache.cache['side-tools-menu-scene'].visible).toBe(false); // enables cache and was previously visible
            expect(manager.routerCache.cache['final-router'].visible).toBe(true); // inherits enabled cache and was previously visible

            manager.routers['side-tools'].show();

            expect(manager.routers['side-tools-menu'].state.visible).toBe(true); // default action
            expect(manager.routers['side-tools-menu-scene'].state.visible).toBe(false); // was last directly hidden
            expect(manager.routers['final-router'].state.visible).toBe(false); // parent was hidden
        });
    });
});
