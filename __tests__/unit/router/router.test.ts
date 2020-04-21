import Router from '../../../src/router_base';
import Manager from '../../../src/manager';
import {IRouterInitArgs, Root, IRouterConfig, RouterInstance} from '../../../src/types';
import {IManager} from '../../../src/types/manager';
import {IRouterBase} from '../../../src/types/router_base';

const DEFAULT_CONFIG = {
    routeKey: 'test',
    isPathRouter: true,
    shouldInverselyActivate: true,
    disableCaching: false, // optional b/c the default is to use the parents
    defaultAction: [],
    shouldParentTryToActivateSiblings: true
} as IRouterConfig<any>;

type RouterArgs<
    RouterType extends 'scene' | 'stack' | 'data' | 'feature' | 'root'
> = IRouterInitArgs<null, RouterType>;

const generateMockInit = <RouterType extends 'scene' | 'stack' | 'data' | 'feature' | 'root'>(
    requiredInits: Partial<RouterArgs<RouterType>> = {},
    optionalInits: Partial<RouterArgs<RouterType>> = {}
): RouterArgs<RouterType> => {
    return {
        name: requiredInits.name || 'test',
        config: requiredInits.config || ({} as IRouterConfig<any>),
        type: requiredInits.type || ('scene' as RouterType),
        manager: (requiredInits.manager || jest.fn()) as IManager,
        root: {} as Root<null>,
        actions: ['show', 'hide'],
        ...optionalInits
    };
};

describe('Router', () => {
    describe('Initialization', () => {
        it('Has required kwargs', () => {
            const initializeWrong = (): IRouterBase<null, 'scene'> =>
                new Router<null, 'scene'>({} as RouterArgs<'scene'>);
            expect(initializeWrong).toThrow(Error);

            const mockInit = generateMockInit<'scene'>();
            const initializeRight = (): IRouterBase<null, 'scene'> =>
                new Router<null, 'scene'>(mockInit);
            expect(initializeRight).not.toThrow(Error);
        });

        it('Can set routeKey', () => {
            const config = {...DEFAULT_CONFIG, routeKey: 'hi'} as IRouterConfig<any>;
            const mockInit = generateMockInit<'scene'>({}, {config});
            const router = new Router<null, 'scene'>(mockInit);
            expect(router.routeKey).toBe('hi');
        });
    });

    describe('Default action', () => {
        it('Can be set', () => {
            const mockInit = generateMockInit<'scene'>(
                {},
                {
                    config: {
                        ...DEFAULT_CONFIG,
                        defaultAction: ['show'] as [string],
                        isDependentOnExternalData: false
                    }
                }
            );
            const router = new Router<null, 'scene'>(mockInit);
            expect(router.config.defaultAction).toEqual(['show']);
        });
    });

    describe('Caching', () => {
        it('Can be disabled', () => {
            const config = {...DEFAULT_CONFIG, disableCaching: true} as IRouterConfig<any>;

            const mockInit = generateMockInit<'scene'>({}, {config});
            const router = new Router<null, 'scene'>(mockInit);
            expect(router.config.disableCaching).toBe(true);
        });
    });

    describe('Is a path router', () => {
        describe('True', () => {
            it('Has no parent', () => {
                const mockInit = generateMockInit<'scene'>();
                const router = new Router<null, 'scene'>(mockInit);
                expect(router.isPathRouter).toBe(true);
            });

            it('Config explicitly sets path router flag', () => {
                const config = {...DEFAULT_CONFIG, isPathRouter: true} as IRouterConfig<any>;

                const mockInit = generateMockInit<'scene'>({
                    config
                });
                const router = new Router<null, 'scene'>(mockInit);
                expect(router.isPathRouter).toBe(true);
            });

            it('Parent is a path router and config option "isPathRouter" set to true', () => {
                const parent = ({
                    isPathRouter: true
                } as unknown) as RouterInstance<null, 'scene'>;
                const config = {...DEFAULT_CONFIG, isPathRouter: true} as IRouterConfig<any>;

                const mockInit = generateMockInit<'scene'>({config}, {parent});
                const router = new Router<null, 'scene'>(mockInit);
                expect(router.isPathRouter).toBe(true);
            });

            it('Parent is a path router and type is "scene" with no neighbors', () => {
                const manager = new Manager({
                    routerDeclaration: {
                        name: 'root',
                        type: 'root',
                        routers: {
                            scene: [{name: 'scene1'}]
                        }
                    }
                });

                expect(manager.routers['scene1'].isPathRouter).toBe(true);
            });

            it('Parent is a path router and type is "scene" with a data neighbor NOT set to be a path router', () => {
                const manager = new Manager({
                    routerDeclaration: {
                        name: 'root',
                        type: 'root',
                        routers: {
                            data: [{name: 'data1', isPathRouter: false}, {name: 'data2'}],
                            scene: [{name: 'scene1'}]
                        }
                    }
                });

                expect(manager.routers['scene1'].isPathRouter).toBe(true);
                expect(manager.routers['data1'].isPathRouter).toBe(false);
                expect(manager.routers['data2'].isPathRouter).toBe(false);
            });

            it('Parent is a path router and type is "data" with no scene neighbors', () => {
                const manager = new Manager({
                    routerDeclaration: {
                        name: 'root',
                        type: 'root',
                        routers: {
                            data: [
                                {name: 'data1', isPathRouter: false},
                                {name: 'data2', isPathRouter: true}
                            ],
                            scene: []
                        }
                    }
                });

                expect(manager.routers['data1'].isPathRouter).toBe(false);
                expect(manager.routers['data2'].isPathRouter).toBe(true);
            });
        });

        describe('False', () => {
            it('Parent is a path router and type is "scene" with a data neighbor set to be a path router', () => {
                const manager = new Manager({
                    routerDeclaration: {
                        name: 'root',
                        type: 'root',
                        routers: {
                            data: [
                                {name: 'data1', isPathRouter: true},
                                {name: 'data2', isPathRouter: false}
                            ],
                            scene: [{name: 'scene1', isPathRouter: false}]
                        }
                    }
                });

                expect(manager.routers['data1'].isPathRouter).toBe(true);
                expect(manager.routers['data2'].isPathRouter).toBe(false);
                expect(manager.routers['scene1'].isPathRouter).toBe(false);
            });
        });

        describe('Error', () => {
            it('Parent is not a path router and config option "isPathRouter" set to true', () => {
                const init = (): IManager =>
                    new Manager({
                        routerDeclaration: {
                            name: 'root',
                            type: 'root',
                            isPathRouter: false,
                            routers: {
                                data: [
                                    {name: 'data1', isPathRouter: true},
                                    {name: 'data2', isPathRouter: false}
                                ],
                                scene: [{name: 'scene1'}]
                            }
                        }
                    });

                expect(init).toThrow(Error);
            });

            // TODO add logic to cover this case
            // eslint-disable-next-line
            it.skip('Parent is a path router and both siblings are able to be visible and are path routers', () => {
                const manager = new Manager({
                    routerDeclaration: {
                        name: 'root',
                        type: 'root',
                        routers: {
                            data: [
                                {name: 'data1', isPathRouter: true},
                                {name: 'data2', isPathRouter: true}
                            ],
                            scene: []
                        }
                    }
                });

                const isPathRouter = (): boolean => manager.routers['data1'].isPathRouter;
                expect(isPathRouter).toThrow(Error);
            });
        });
    });

    describe('Siblings', () => {
        it('Returns all siblings, not including itself', () => {
            const manager = new Manager({
                routerDeclaration: {
                    name: 'root',
                    type: 'root',
                    routers: {
                        data: [
                            {name: 'data1', isPathRouter: true},
                            {name: 'data2', isPathRouter: false}
                        ],
                        scene: [{name: 'scene1', isPathRouter: false}]
                    }
                }
            });

            expect(manager.routers['data1'].siblings).toHaveLength(1);
            expect(manager.routers['data2'].siblings).toHaveLength(1);
            expect(manager.routers['scene1'].siblings).toHaveLength(0);
        });
    });

    describe('Neighbors', () => {
        it('Returns all neighbors of type', () => {
            const manager = new Manager({
                routerDeclaration: {
                    name: 'root',
                    type: 'root',
                    isPathRouter: false,
                    routers: {
                        data: [
                            {name: 'data1', isPathRouter: true},
                            {name: 'data2', isPathRouter: false}
                        ],
                        scene: [{name: 'scene1', isPathRouter: false}]
                    }
                }
            });

            expect(manager.routers['data1'].getNeighborsByType('scene')).toHaveLength(1);
            expect(manager.routers['data2'].getNeighborsByType('feature')).toHaveLength(0);
            expect(manager.routers['scene1'].getNeighborsByType('data')).toHaveLength(2);
        });
    });

    describe('Route key', () => {
        it('Returns the name if no route key is set during initialization', () => {
            const dataRouterOne = new Router<null, 'data'>(
                generateMockInit({name: 'data1', type: 'data'})
            );
            expect(dataRouterOne.routeKey).toBe('data1');
        });

        it('Returns the route key if one was set during initialization', () => {
            const config = {...DEFAULT_CONFIG, routeKey: 'hello'} as IRouterConfig<any>;

            const dataRouterOne = new Router<null, 'data'>(
                generateMockInit({
                    name: 'data1',
                    type: 'data',
                    config
                })
            );
            expect(dataRouterOne.routeKey).toBe('hello');
        });
    });
});
