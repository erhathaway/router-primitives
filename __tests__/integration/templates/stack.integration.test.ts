import {
    Manager,
    isMemorySerializedStateStore,
    NativeSerializedStore,
    ISerializedStateStore,
    isStackRouter,
    AllTemplates,
    IRouterDeclaration
} from '../../../src';

describe('Integration', () => {
    const routerTree: IRouterDeclaration<AllTemplates> = {
        name: 'root',
        routers: {
            scene: [
                {
                    name: 'user', // pathRouter scene
                    routers: {
                        scene: [{name: 'events'}, {name: 'details'}]
                    }
                },
                {name: 'info'}
            ],
            stack: [
                {
                    name: 'welcome-modal',
                    routers: {
                        stack: [{name: 'cookies-popup', routeKey: 'short'}],
                        scene: [
                            {name: 'welcome-main'}, // non-pathRouter scene
                            {name: 'welcome-end'}
                        ]
                    }
                },
                {name: 'cookies-modal'},
                {name: 'data-modal'}
            ]
        }
    };

    describe('Stack template', () => {
        describe('Actions', () => {
            it('Can have replace location action option set', () => {
                const manager = new Manager({routerTree});
                const welcomeModalRouter = manager.routers['welcome-modal'];
                const cookiesModalRouter = manager.routers['cookies-modal'];

                const serializedStateStore = manager.serializedStateStore as NativeSerializedStore;

                if (!isMemorySerializedStateStore(serializedStateStore)) {
                    throw Error(
                        `Wrong store type: ${(serializedStateStore as ISerializedStateStore).kind}`
                    );
                }
                welcomeModalRouter.show();
                expect(serializedStateStore.history).toHaveLength(2);

                cookiesModalRouter.show({replaceLocation: true});

                expect(serializedStateStore.history).toHaveLength(2);

                cookiesModalRouter.hide({replaceLocation: true});

                expect(serializedStateStore.history).toHaveLength(2);

                cookiesModalRouter.show();

                expect(serializedStateStore.history).toHaveLength(3);

                cookiesModalRouter.hide({replaceLocation: false});

                expect(serializedStateStore.history).toHaveLength(4);
            });

            it('Show sets order to 1 if the only stack router', () => {
                const manager = new Manager({routerTree});
                const welcomeObserver = jest.fn();
                const welcomeRouter = manager.routers['welcome-modal'];
                welcomeRouter.subscribe(welcomeObserver);

                welcomeRouter.show();

                expect(welcomeRouter.isPathRouter).toBe(false);
                expect(welcomeObserver.mock.calls[1][0]).toEqual({
                    current: {data: 1, visible: true, actionCount: 3},
                    historical: [{data: undefined, visible: false, actionCount: 1}]
                });

                welcomeRouter.show();

                // second action call should do nothing since its identical to the first
                expect(welcomeObserver.mock.calls[2]).toBe(undefined);
            });

            it('Hide sets order to undefined if the only stack router', () => {
                const manager = new Manager({routerTree});
                const welcomeObserver = jest.fn();
                const welcomeRouter = manager.routers['welcome-modal'];
                welcomeRouter.subscribe(welcomeObserver);

                welcomeRouter.show();
                welcomeRouter.hide();

                expect(welcomeRouter.isPathRouter).toBe(false);
                expect(welcomeObserver.mock.calls[2][0]).toEqual({
                    current: {data: undefined, visible: false, actionCount: 4},
                    historical: [
                        {data: 1, visible: true, actionCount: 3},
                        {data: undefined, visible: false, actionCount: 1}
                    ]
                });

                welcomeRouter.hide();

                // second action call should do nothing since its identical to the first
                expect(welcomeObserver.mock.calls[3]).toBe(undefined);
            });

            it('"Show" and "Hide" with existing stacks change ordering', () => {
                const manager = new Manager({routerTree});
                const welcomeObserver = jest.fn();
                const cookiesObserver = jest.fn();
                const dataObserver = jest.fn();

                const welcomeRouter = manager.routers['welcome-modal'];
                const cookiesRouter = manager.routers['cookies-modal'];
                const dataRouter = manager.routers['data-modal'];

                welcomeRouter.subscribe(welcomeObserver);
                cookiesRouter.subscribe(cookiesObserver);
                dataRouter.subscribe(dataObserver);

                dataRouter.show();
                welcomeRouter.show();
                cookiesRouter.show();

                expect(dataObserver.mock.calls[1][0].current).toEqual({
                    data: 1,
                    visible: true,
                    actionCount: 3
                });
                expect(dataObserver.mock.calls[2][0].current).toEqual({
                    data: 2,
                    visible: true,
                    actionCount: 4
                });
                expect(dataObserver.mock.calls[3][0].current).toEqual({
                    data: 3,
                    visible: true,
                    actionCount: 5
                });

                expect(welcomeObserver.mock.calls[2][0].current).toEqual({
                    data: 2,
                    visible: true,
                    actionCount: 5
                });
                expect(cookiesObserver.mock.calls[1][0].current).toEqual({
                    data: 1,
                    visible: true,
                    actionCount: 5
                });

                cookiesRouter.show();

                // second action call should do nothing since its identical to the first
                expect(cookiesObserver.mock.calls[2]).toBe(undefined);

                welcomeRouter.show();

                expect(welcomeObserver.mock.calls[3][0].current).toEqual({
                    data: 1,
                    visible: true,
                    actionCount: 7
                });
                expect(cookiesObserver.mock.calls[2][0].current).toEqual({
                    data: 2,
                    visible: true,
                    actionCount: 7
                });

                // hasn't changed state even though the ordering of the other two routers have
                expect(dataObserver.mock.calls[4]).toBe(undefined);
                expect(dataObserver.mock.calls[3][0].current).toEqual({
                    data: 3,
                    visible: true,
                    actionCount: 5
                });

                welcomeRouter.hide();

                expect(welcomeObserver.mock.calls[4][0].current).toEqual({
                    data: undefined,
                    visible: false,
                    actionCount: 8
                });
                expect(cookiesObserver.mock.calls[3][0].current).toEqual({
                    data: 1,
                    visible: true,
                    actionCount: 8
                });
                expect(dataObserver.mock.calls[4][0].current).toEqual({
                    data: 2,
                    visible: true,
                    actionCount: 8
                });
            });

            it('Movement actions work - forward, backwards, toFront, toBack', () => {
                const manager = new Manager({routerTree});
                const welcomeObserver = jest.fn();
                const cookiesObserver = jest.fn();
                const dataObserver = jest.fn();

                const welcomeRouter = manager.routers['welcome-modal'];
                const cookiesRouter = manager.routers['cookies-modal'];
                const dataRouter = manager.routers['data-modal'];

                welcomeRouter.subscribe(welcomeObserver);
                cookiesRouter.subscribe(cookiesObserver);
                dataRouter.subscribe(dataObserver);

                if (
                    !isStackRouter(welcomeRouter) ||
                    !isStackRouter(cookiesRouter) ||
                    !isStackRouter(dataRouter)
                ) {
                    throw new Error('router is not stack router');
                }

                dataRouter.show();
                welcomeRouter.toFront();
                cookiesRouter.toFront();

                expect(dataObserver.mock.calls[1][0].current).toEqual({
                    data: 1,
                    visible: true,
                    actionCount: 3
                });
                expect(dataObserver.mock.calls[2][0].current).toEqual({
                    data: 2,
                    visible: true,
                    actionCount: 4
                });
                expect(dataObserver.mock.calls[3][0].current).toEqual({
                    data: 3,
                    visible: true,
                    actionCount: 5
                });

                expect(welcomeObserver.mock.calls[2][0].current).toEqual({
                    data: 2,
                    visible: true,
                    actionCount: 5
                });
                expect(cookiesObserver.mock.calls[1][0].current).toEqual({
                    data: 1,
                    visible: true,
                    actionCount: 5
                });

                dataRouter.toFront();

                expect(dataObserver.mock.calls[4][0].current).toEqual({
                    data: 1,
                    visible: true,
                    actionCount: 6
                });
                expect(welcomeObserver.mock.calls[3][0].current).toEqual({
                    data: 3,
                    visible: true,
                    actionCount: 6
                });
                expect(cookiesObserver.mock.calls[2][0].current).toEqual({
                    data: 2,
                    visible: true,
                    actionCount: 6
                });

                dataRouter.toBack();

                expect(dataObserver.mock.calls[5][0].current).toEqual({
                    data: 3,
                    visible: true,
                    actionCount: 7
                });
                expect(welcomeObserver.mock.calls[4][0].current).toEqual({
                    data: 2,
                    visible: true,
                    actionCount: 7
                });
                expect(cookiesObserver.mock.calls[3][0].current).toEqual({
                    data: 1,
                    visible: true,
                    actionCount: 7
                });

                welcomeRouter.toBack();

                expect(dataObserver.mock.calls[6][0].current).toEqual({
                    data: 2,
                    visible: true,
                    actionCount: 8
                });
                expect(welcomeObserver.mock.calls[5][0].current).toEqual({
                    data: 3,
                    visible: true,
                    actionCount: 8
                });
                expect(cookiesObserver.mock.calls[4]).toBe(undefined);

                welcomeRouter.forward();

                expect(dataObserver.mock.calls[7][0].current).toEqual({
                    data: 3,
                    visible: true,
                    actionCount: 9
                });
                expect(welcomeObserver.mock.calls[6][0].current).toEqual({
                    data: 2,
                    visible: true,
                    actionCount: 9
                });
                expect(cookiesObserver.mock.calls[4]).toBe(undefined);

                welcomeRouter.backward();

                expect(dataObserver.mock.calls[8][0].current).toEqual({
                    data: 2,
                    visible: true,
                    actionCount: 10
                });
                expect(welcomeObserver.mock.calls[7][0].current).toEqual({
                    data: 3,
                    visible: true,
                    actionCount: 10
                });
                expect(cookiesObserver.mock.calls[4]).toBe(undefined);

                cookiesRouter.backward();

                expect(dataObserver.mock.calls[9][0].current).toEqual({
                    data: 1,
                    visible: true,
                    actionCount: 11
                });
                expect(welcomeObserver.mock.calls[8]).toBe(undefined);
                expect(cookiesObserver.mock.calls[4][0].current).toEqual({
                    data: 2,
                    visible: true,
                    actionCount: 11
                });
            });
        });
    });
});
