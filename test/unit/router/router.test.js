import Router from '../../../src/router/base';

const generateMockInit = (requiredInits = {}, optionalInits = {}) => {
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
      const initializeWrong = () => new Router();
      expect(initializeWrong).toThrow(Error);

      const mockInit = generateMockInit();
      const initializeRight = () => new Router(mockInit);
      expect(initializeRight).not.toThrow(Error);
    });

    it('Can set routeKey', () => {
      const mockInit = generateMockInit({}, { config: { routeKey: 'hi' }} );
      const router = new Router(mockInit);
      expect(router.routeKey).toBe('hi');
    })
  });

  describe('Default action', () => {
    it('Can be set', () => {
      const mockInit = generateMockInit({}, { defaultShow: true });
      const router = new Router(mockInit);
      expect(router.defaultShow).toBe(true);
    });
  });

  describe('Caching', () => {
    it('Can be disabled', () => {
      const mockInit = generateMockInit({}, { disableCaching: true });
      const router = new Router(mockInit);
      expect(router.disableCaching).toBe(true);
    });
  });

  describe('Is a path router', () => {
    describe('True', () => {
      it('Has no parent', () => {
        const mockInit = generateMockInit({ isPathRouter: true });
        const router = new Router(mockInit);
        expect(router.isPathRouter).toBe(true);
      });

      it('Parent is a path router and config option "isPathRouter" set to true', () => {
        const mockInit = generateMockInit({ config: { isPathRouter: true } }, { parent: { isPathRouter: true } });
        const router = new Router(mockInit);
        expect(router.isPathRouter).toBe(true);
      });

      it('Parent is a path router and type is "scene" with no neighbors', () => {
        const mockInit = generateMockInit({ type: 'scene' }, { parent: { isPathRouter: true } });
        const router = new Router(mockInit);
        expect(router.isPathRouter).toBe(true);
      })

      it('Parent is a path router and type is "scene" with a data neighbor NOT set to be a path router', () => {
        const dataRouterOne = new Router(generateMockInit({ name: 'data1', type: 'data', config: { isPathRouter: false } }));
        const dataRouterTwo = new Router(generateMockInit({ type: 'data' }));
        const sceneRouter = new Router(generateMockInit({ name: 'scene1', type: 'scene' }));
        const parentRouter = new Router(generateMockInit());

        parentRouter._addChildRouter(dataRouterOne);
        parentRouter._addChildRouter(dataRouterTwo);
        parentRouter._addChildRouter(sceneRouter);

        expect(sceneRouter.isPathRouter).toBe(true);
        expect(dataRouterOne.isPathRouter).toBe(false);
        expect(dataRouterTwo.isPathRouter).toBe(false);
      });

      it('Parent is a path router and type is "data" with no scene neighbors', () => {
        const dataRouterOne = new Router(generateMockInit({ name: 'data1', type: 'data', config: { isPathRouter: true } }));
        const dataRouterTwo = new Router(generateMockInit({ type: 'data' }));
        const sceneRouter = new Router(generateMockInit({ name: 'scene1', type: 'feature' }));
        const parentRouter = new Router(generateMockInit());

        parentRouter._addChildRouter(dataRouterOne);
        parentRouter._addChildRouter(dataRouterTwo);
        parentRouter._addChildRouter(sceneRouter);

        expect(dataRouterOne.isPathRouter).toBe(true);
        expect(dataRouterTwo.isPathRouter).toBe(false);
      });
    });

    describe('False', () => {
      it('Parent is a path router and type is "scene" with a data neighbor set to be a path router', () => {
        const dataRouterOne = new Router(generateMockInit({ name: 'data1', type: 'data', config: { isPathRouter: false } }));
        const dataRouterTwo = new Router(generateMockInit({ type: 'data', config: { isPathRouter: true } }));
        const sceneRouter = new Router(generateMockInit({ name: 'scene1', type: 'scene' }));
        const parentRouter = new Router(generateMockInit());

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
        const router = new Router(mockInit);

        const isPathRouter = () => router.isPathRouter;
        expect(isPathRouter).toThrow(Error);
      });
    });
  });

  describe('Siblings', () => {
    it('Returns all siblings, not including itself', () => {
      const dataRouterOne = new Router(generateMockInit({ name: 'data1', type: 'data' }));
      const dataRouterTwo = new Router(generateMockInit({ type: 'data' }));
      const sceneRouter = new Router(generateMockInit({ name: 'scene1', type: 'scene' }));
      const parentRouter = new Router(generateMockInit());

      parentRouter._addChildRouter(dataRouterOne);
      parentRouter._addChildRouter(dataRouterTwo);
      parentRouter._addChildRouter(sceneRouter);

      expect(sceneRouter.siblings.length).toBe(0);
      expect(dataRouterOne.siblings.length).toBe(1);
      expect(dataRouterTwo.siblings.length).toBe(1);
    });
  });

  describe('Neighbors', () => {
    it('Returns all neighbors of type', () => {
      const dataRouterOne = new Router(generateMockInit({ name: 'data1', type: 'data' }));
      const dataRouterTwo = new Router(generateMockInit({ type: 'data' }));
      const sceneRouter = new Router(generateMockInit({ name: 'scene1', type: 'scene' }));
      const parentRouter = new Router(generateMockInit());

      parentRouter._addChildRouter(dataRouterOne);
      parentRouter._addChildRouter(dataRouterTwo);
      parentRouter._addChildRouter(sceneRouter);

      expect(sceneRouter.getNeighborsByType('data').length).toBe(2);
      expect(dataRouterOne.getNeighborsByType('scene').length).toBe(1);
      expect(dataRouterTwo.getNeighborsByType('feature').length).toBe(0);
    });
  });

  describe('Route key', () => {
    it('Returns the name if no route key is set during initalization', () => {
      const dataRouterOne = new Router(generateMockInit({ name: 'data1', type: 'data' }));
      expect(dataRouterOne.routeKey).toBe('data1');
    });

    it('Returns the route key if one was set during initalization', () => {
      const dataRouterOne = new Router(generateMockInit({ name: 'data1', type: 'data', config: { routeKey: 'hello' } }));
      expect(dataRouterOne.routeKey).toBe('hello');
    });
  });

  describe('Location Caching', () => {
    describe('Calculation', () => {
      describe('Path routers', () => {
        it('Data router returns path location and data', () => {
          const mockGetState = () => ({ current: { data: 'here', visible: true } , historical: [{}] })
          const childRouter = new Router(generateMockInit({ name: 'child', type: 'data' }, { getState: mockGetState }));
          const parentRouter = new Router(generateMockInit());
    
          parentRouter._addChildRouter(childRouter);
          expect(childRouter.calcCachedLocation()).toEqual({ isPathData: true, pathLocation: 0, value: 'here' });
        });

        it('All other path types return path location and visibility', () => {
          const mockGetState = () => ({ current: { data: 'here', visible: true } , historical: [{}] })
          const childRouter = new Router(generateMockInit({ name: 'child', type: 'scene' }, { getState: mockGetState }));
          const parentRouter = new Router(generateMockInit());
    
          parentRouter._addChildRouter(childRouter);
          expect(childRouter.calcCachedLocation()).toEqual({ isPathData: true, pathLocation: 0, value: true });
        });
      });

      describe('Non path routers', () => {
        it('Data router returns query param and data', () => {
          const mockGetState = () => ({ current: { data: 'here', visible: true } , historical: [{}] })
          const childRouter = new Router(generateMockInit({ name: 'child', type: 'data' }, { getState: mockGetState }));
          const featureRouter = new Router(generateMockInit({ name: 'feature1', type: 'feature' }, { getState: mockGetState }));
          const parentRouter = new Router(generateMockInit({}));
    
          parentRouter._addChildRouter(featureRouter);
          featureRouter._addChildRouter(childRouter);

          expect(childRouter.calcCachedLocation()).toEqual({ queryParam: 'child', value: 'here' });
        });

        it('Stack router returns query param and order', () => {
          const mockGetState = () => ({ current: { data: 'here', visible: true, order: 2 } , historical: [{}] })
          const childRouter = new Router(generateMockInit({ name: 'child', type: 'stack' }, { getState: mockGetState }));
          const featureRouter = new Router(generateMockInit({ name: 'feature1', type: 'feature' }, { getState: mockGetState }));
          const parentRouter = new Router(generateMockInit({}));
    
          parentRouter._addChildRouter(featureRouter);
          featureRouter._addChildRouter(childRouter);

          expect(childRouter.calcCachedLocation()).toEqual({ queryParam: 'child', value: 2 });
        });

        it('Scene and feature router returns query param and visibility', () => {
          const mockGetState = () => ({ current: { data: 'here', visible: true, order: 2 } , historical: [{}] })
          const childRouter = new Router(generateMockInit({ name: 'child', type: 'scene' }, { getState: mockGetState }));
          const featureRouter = new Router(generateMockInit({ name: 'feature1', type: 'feature' }, { getState: mockGetState }));
          const parentRouter = new Router(generateMockInit({}));
    
          parentRouter._addChildRouter(featureRouter);
          featureRouter._addChildRouter(childRouter);

          expect(childRouter.calcCachedLocation()).toEqual({ queryParam: 'child', value: true });
          expect(featureRouter.calcCachedLocation()).toEqual({ queryParam: 'feature1', value: true });
        });
      });

      it('Works with pased in global state', () => {
        const state1 = { current: { data: 'here', visible: true, order: 2 }, historical: [{}] };
        const state2 = { current: { data: 'notHere', visible: false, order: 3 }, historical: [{}] };
        const mockGetState = () => (state1);
        const childRouter = new Router(generateMockInit({ name: 'child', type: 'stack' }, { getState: mockGetState }));
        const featureRouter = new Router(generateMockInit({ name: 'feature1', type: 'feature' }, { getState: mockGetState }));
        const parentRouter = new Router(generateMockInit({}));
  
        parentRouter._addChildRouter(featureRouter);
        featureRouter._addChildRouter(childRouter);

        const globalState = { feature1: state1, child: state2 };

        expect(childRouter.calcCachedLocation(globalState)).toEqual({ queryParam: 'child', value: 3 });
      });

      describe('Joins cached location with regular location object', () => {
        it('Works with path cached locations', () => {
          // TODO figure out why pulling this out to the describe block causes location to be mutated
          const location = { 
            path: ['home', 'scene1', 'scene2'], 
            search: { feature1: true, feature2: false, data22: 'okay', stack1: 0 },
            options: { mutateLocation: false }, 
          };

          const cachedLocation = { isPathData: true, pathLocation: 1, value: 'newScene' };

          expect(Router.joinLocationWithCachedLocation(location, cachedLocation))
            .toEqual({
              path: ['home', 'newScene', 'scene2'], 
              search: { feature1: true, feature2: false, data22: 'okay', stack1: 0 },
              options: { mutateLocation: false }, 
            });
        });


        it('Works with query param cached locations', () => {
          const location = { 
            path: ['home', 'scene1', 'scene2'], 
            search: { feature1: true, feature2: false, data22: 'okay', stack1: 0 },
            options: { mutateLocation: false }, 
          };

          const cachedLocation = { queryParam: 'stack1', value: 3 };

          expect(Router.joinLocationWithCachedLocation(location, cachedLocation))
            .toEqual({
              path: ['home', 'scene1', 'scene2'], 
              search: { feature1: true, feature2: false, data22: 'okay', stack1: 3 },
              options: { mutateLocation: false }, 
            });
        });
      })
    });
  });
});