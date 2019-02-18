import Manager from '../../../src/manager';

describe('Integration', () => {
  const routerTreeForDefaultShowTest = {
    name: 'root',
    routers: {
      scene: [
        { name: 'user', // pathRouter scene
          routers: {
            scene: [{ name: 'events', defaultShow: true }, { name: 'details' }],
          },
        },
        { name: 'info' }],
      feature: [{ name: 'toolbar', 
        routers: {
          scene: [
            { name: 'main-tools' }, // non-pathRouter scene
            { name: 'side-tools', 
              defaultShow: true,
              routers: {
                feature: [{ name: 'side-tools-menu', defaultShow: true }]
              },
            },
          ]
        }
      }],
      stack: [{ name: 'notification-modal', routeKey: 'short' }],
    }
  };

  describe('Scene template', () => {
    describe('Actions', () => {
      describe('Show', () => {
        const manager = new Manager({ routerTree: routerTreeForDefaultShowTest });
        console.log('hurrr')

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
          expect(userObserver.mock.calls[0][0]).toEqual({ current: { visible: true }, historical: [] });
  
          // second action call should do nothing since its idential to the first
          expect(userObserver.mock.calls[1]).toBe(undefined);
        });
  
        it('On non pathRouter child of rootRouter', () => {
          toolbarRouter.show();
          mainToolsRouter.show();
          expect(mainToolsRouter.isPathRouter).toBe(false);
  
          // should have a history of 1 b/c the userRouter.show() caused the router tree to reduce state when toolbar wasn't visible
          expect(mainToolsObserver.mock.calls[0][0]).toEqual({ current: { visible: true }, historical: [{ visible: false }] });
          // only one state update should have been made for this router
          expect(mainToolsObserver.mock.calls.length).toBe(1);
        });
      });

      describe('Hide', () => {
        const manager = new Manager({ routerTree: routerTreeForDefaultShowTest });

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
          expect(userObserver.mock.calls[1][0]).toEqual({ current: { visible: false }, historical: [{ visible: true }] });
        });
  
        it('On non pathRouter child of rootRouter', () => {
          mainToolsRouter.show();
  
          expect(mainToolsRouter.isPathRouter).toBe(false);
          expect(mainToolsRouter.state.visible).toBe(true);

          mainToolsRouter.hide();

          expect(mainToolsRouter.state.visible).toBe(false);
          expect(mainToolsObserver.mock.calls[1][0]).toEqual({ current: { visible: false }, historical: [{ visible: true }, { visible: false }] });
        });
      });
    });
  });

  describe('View Defaults', () => {
    const manager = new Manager({ routerTree: routerTreeForDefaultShowTest });

    it('Are set when a parent router is called', () => {
      const userObserver = jest.fn();
      const userRouter = manager.routers['user'];
      userRouter.subscribe(userObserver);
  
      const eventsObserver = jest.fn();
      const eventsRouter = manager.routers['events'];
      eventsRouter.subscribe(eventsObserver);

      userRouter.show();
      
      expect(manager.routers['info'].state.visible).toBe(false);
      expect(eventsObserver.mock.calls[0][0].current).toEqual({ visible: true });
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
      expect(sideToolsObserver.mock.calls[0][0].current).toEqual({ visible: true });
      expect(sideToolsMenuObserver.mock.calls[0][0].current).toEqual({ visible: true });
    });
  });

  describe('Caching', () => {
    const routerTreeForCacheTest = {
      name: 'root',
      routers: {
        scene: [{ name: 'user' }],
        feature: [{ 
          name: 'toolbar', 
          routers: {
            scene: [
              { name: 'main-tools' }, // non-pathRouter scene
              { name: 'side-tools', 
                defaultShow: true,
                disableCaching: true, // disable caching
                routers: {
                  feature: [{ 
                    name: 'side-tools-menu', 
                    defaultShow: true,
                    routers: {
                      scene: [{
                        name: 'side-tools-menu-scene',
                        defaultShow: false,
                        disableCaching: false, // enable caching
                        routers: {
                          scene: [{ name: 'final-router', defaultShow: false }]
                        }
                      }]
                    }
                  }],
                },
              },
            ]
          }
        }],
        stack: [{ name: 'notification-modal', routeKey: 'short' }],
      }
    };
    const manager = new Manager({ routerTree: routerTreeForCacheTest });

    it('Caching of children on hide', () => {
      // caches children but avoids children between disable cache levels
      expect(manager.routers['side-tools-menu'].cache.state).toBe(undefined);
      expect(manager.routers['side-tools-menu-scene'].cache.state).toBe(undefined);
      expect(manager.routers['final-router'].cache.state).toBe(undefined);

      manager.routers['toolbar'].show();

      expect(manager.routers['side-tools-menu'].state.visible).toBe(true);
      expect(manager.routers['side-tools-menu-scene'].state.visible).toBe(false);
      expect(manager.routers['final-router'].state.visible).toBe(false);

      manager.routers['side-tools-menu-scene'].show();
      manager.routers['final-router'].show();

      expect(manager.routers['side-tools-menu'].cache.state).toBe(undefined);
      expect(manager.routers['side-tools-menu-scene'].cache.state).toBe(undefined);
      expect(manager.routers['final-router'].cache.state).toBe(undefined);

      expect(manager.routers['side-tools-menu'].state.visible).toBe(true);
      expect(manager.routers['side-tools-menu-scene'].state.visible).toBe(true);
      expect(manager.routers['final-router'].state.visible).toBe(true);

      manager.routers['toolbar'].hide();

      expect(manager.routers['side-tools-menu'].cache.state).toBe(undefined);
      expect(manager.routers['side-tools-menu-scene'].cache.state).toBe(true);
      expect(manager.routers['final-router'].cache.state).toBe(true);

      expect(manager.routers['side-tools-menu'].state.visible).toBe(false);
      expect(manager.routers['side-tools-menu-scene'].state.visible).toBe(false);
      expect(manager.routers['final-router'].state.visible).toBe(false);
    });

    it('uses cache to restore visibility', () => {
      manager.routers['side-tools-menu'].show();

      expect(manager.routers['side-tools-menu'].state.visible).toBe(true);
      expect(manager.routers['side-tools-menu-scene'].state.visible).toBe(true);
      expect(manager.routers['final-router'].state.visible).toBe(true);

      expect(manager.routers['side-tools-menu'].cache.state).toBe(undefined);
      expect(manager.routers['side-tools-menu-scene'].cache.state).toBe(undefined);
      expect(manager.routers['final-router'].cache.state).toBe(undefined);

      manager.routers['side-tools-menu'].hide();

      expect(manager.routers['side-tools-menu'].cache.state).toBe(false);
      expect(manager.routers['side-tools-menu-scene'].cache.state).toBe(true);
      expect(manager.routers['final-router'].cache.state).toBe(true);

      manager.routers['side-tools'].hide();

      expect(manager.routers['side-tools-menu'].cache.state).toBe(false);
      expect(manager.routers['side-tools-menu-scene'].cache.state).toBe(true);
      expect(manager.routers['final-router'].cache.state).toBe(true);

      manager.routers['side-tools'].hide();

      expect(manager.routers['side-tools-menu'].state.visible).toBe(false);
    })
  });
});