import Router from '../../../src/router/base';
import Manager from '../../../src/manager';

interface IRequiredInits {
  name?: string;
  config?: {};
  type?: string;
  manager?: Manager;
  isPathRouter?: boolean;
}

const generateMockInit = (requiredInits: IRequiredInits = {}, optionalInits = {}) => {
  return {
    name: requiredInits.name || 'test',
    config: requiredInits.config || {},
    type: requiredInits.type || 'test',
    manager: requiredInits.manager || jest.fn(),
    ...optionalInits,
  };
}

describe('Router', () => {
  describe('Initialization', () => {
    it('Has required kwargs', () => {
      const initializeWrong = () => new (Router as any)({});
      expect(initializeWrong).toThrow(Error);

      const mockInit = generateMockInit();
      const initializeRight = () => new (Router as any)(mockInit);
      expect(initializeRight).not.toThrow(Error);
    });

    it('Can set routeKey', () => {
      const mockInit = generateMockInit({}, { config: { routeKey: 'hi' }} );
      const router = new (Router as any)(mockInit);
      expect(router.routeKey).toBe('hi');
    })
  });

  describe('Default action', () => {
    it('Can be set', () => {
      const mockInit = generateMockInit({}, { config: { defaultShow: true }} );
      const router = new (Router as any)(mockInit);
      expect(router.config.defaultShow).toBe(true);
    });
  });

  describe('Caching', () => {
    it('Can be disabled', () => {
      const mockInit = generateMockInit({}, { config: { disableCaching: true }});
      const router = new (Router as any)(mockInit);
      expect(router.config.disableCaching).toBe(true);
    });
  });

  describe('Is a path router', () => {
    describe('True', () => {
      it('Has no parent', () => {
        const mockInit = generateMockInit({ isPathRouter: true });
        const router = new (Router as any)(mockInit);
        expect(router.isPathRouter).toBe(true);
      });

      it('Parent is a path router and config option "isPathRouter" set to true', () => {
        const mockInit = generateMockInit({ config: { isPathRouter: true } }, { parent: { isPathRouter: true } });
        const router = new (Router as any)(mockInit);
        expect(router.isPathRouter).toBe(true);
      });

      it('Parent is a path router and type is "scene" with no neighbors', () => {
        const mockInit = generateMockInit({ type: 'scene' }, { parent: { isPathRouter: true } });
        const router = new (Router as any)(mockInit);
        expect(router.isPathRouter).toBe(true);
      })

      it('Parent is a path router and type is "scene" with a data neighbor NOT set to be a path router', () => {
        const dataRouterOne = new (Router as any)(generateMockInit({ name: 'data1', type: 'data', config: { isPathRouter: false } }));
        const dataRouterTwo = new (Router as any)(generateMockInit({ type: 'data' }));
        const sceneRouter = new (Router as any)(generateMockInit({ name: 'scene1', type: 'scene' }));
        const parentRouter = new (Router as any)(generateMockInit());

        parentRouter._addChildRouter(dataRouterOne);
        parentRouter._addChildRouter(dataRouterTwo);
        parentRouter._addChildRouter(sceneRouter);

        expect(sceneRouter.isPathRouter).toBe(true);
        expect(dataRouterOne.isPathRouter).toBe(false);
        expect(dataRouterTwo.isPathRouter).toBe(false);
      });

      it('Parent is a path router and type is "data" with no scene neighbors', () => {
        const dataRouterOne = new (Router as any)(generateMockInit({ name: 'data1', type: 'data', config: { isPathRouter: true } }));
        const dataRouterTwo = new (Router as any)(generateMockInit({ type: 'data' }));
        const sceneRouter = new (Router as any)(generateMockInit({ name: 'scene1', type: 'feature' }));
        const parentRouter = new (Router as any)(generateMockInit());

        parentRouter._addChildRouter(dataRouterOne);
        parentRouter._addChildRouter(dataRouterTwo);
        parentRouter._addChildRouter(sceneRouter);

        expect(dataRouterOne.isPathRouter).toBe(true);
        expect(dataRouterTwo.isPathRouter).toBe(false);
      });
    });

    describe('False', () => {
      it('Parent is a path router and type is "scene" with a data neighbor set to be a path router', () => {
        const dataRouterOne = new (Router as any)(generateMockInit({ name: 'data1', type: 'data', config: { isPathRouter: false } }));
        const dataRouterTwo = new (Router as any)(generateMockInit({ type: 'data', config: { isPathRouter: true } }));
        const sceneRouter = new (Router as any)(generateMockInit({ name: 'scene1', type: 'scene' }));
        const parentRouter = new (Router as any)(generateMockInit());

        parentRouter._addChildRouter(dataRouterOne);
        parentRouter._addChildRouter(dataRouterTwo);
        parentRouter._addChildRouter(sceneRouter);

        expect(sceneRouter.isPathRouter).toBe(false);
        expect(dataRouterOne.isPathRouter).toBe(false);
        expect(dataRouterTwo.isPathRouter).toBe(true);
      });
    });

    describe('Error', () => {
      it('Parent is not a path router and config option "isPathRouter" set to true', () => {
        const mockInit = generateMockInit({ config: { isPathRouter: true }}, { parent: { isPathRouter: false } });
        const router = new (Router as any)(mockInit);

        const isPathRouter = () => router.isPathRouter;
        expect(isPathRouter).toThrow(Error);
      });
    });
  });

  describe('Siblings', () => {
    it('Returns all siblings, not including itself', () => {
      const dataRouterOne = new (Router as any)(generateMockInit({ name: 'data1', type: 'data' }));
      const dataRouterTwo = new (Router as any)(generateMockInit({ type: 'data' }));
      const sceneRouter = new (Router as any)(generateMockInit({ name: 'scene1', type: 'scene' }));
      const parentRouter = new (Router as any)(generateMockInit());

      parentRouter._addChildRouter(dataRouterOne);
      parentRouter._addChildRouter(dataRouterTwo);
      parentRouter._addChildRouter(sceneRouter);

      expect(sceneRouter.siblings).toHaveLength(0);
      expect(dataRouterOne.siblings).toHaveLength(1);
      expect(dataRouterTwo.siblings).toHaveLength(1);
    });
  });

  describe('Neighbors', () => {
    it('Returns all neighbors of type', () => {
      const dataRouterOne = new (Router as any)(generateMockInit({ name: 'data1', type: 'data' }));
      const dataRouterTwo = new (Router as any)(generateMockInit({ type: 'data' }));
      const sceneRouter = new (Router as any)(generateMockInit({ name: 'scene1', type: 'scene' }));
      const parentRouter = new (Router as any)(generateMockInit());

      parentRouter._addChildRouter(dataRouterOne);
      parentRouter._addChildRouter(dataRouterTwo);
      parentRouter._addChildRouter(sceneRouter);

      expect(sceneRouter.getNeighborsByType('data')).toHaveLength(2);
      expect(dataRouterOne.getNeighborsByType('scene')).toHaveLength(1);
      expect(dataRouterTwo.getNeighborsByType('feature')).toHaveLength(0);
    });
  });

  describe('Route key', () => {
    it('Returns the name if no route key is set during initalization', () => {
      const dataRouterOne = new (Router as any)(generateMockInit({ name: 'data1', type: 'data' }));
      expect(dataRouterOne.routeKey).toBe('data1');
    });

    it('Returns the route key if one was set during initalization', () => {
      const dataRouterOne = new (Router as any)(generateMockInit({ name: 'data1', type: 'data', config: { routeKey: 'hello' } }));
      expect(dataRouterOne.routeKey).toBe('hello');
    });
  });
});