import Manager from '../../src/manager';
import { NativeSerializedStore, BrowserSerializedStore } from '../../src/serializedState';
import RouterStore from '../../src/routerState';

describe('Integration', () => {
  const routerTree = {
    name: 'root',
    routers: {
      scene: [
        { name: 'user', // pathRouter scene
          routers: {
            scene: [{ name: 'events' }, { name: 'details' }],
          },
        },
        { name: 'info' }],
      feature: [{ name: 'toolbar', 
        routers: {
          scene: [
            { name: 'main-tools' }, // non-pathRouter scene
            { name: 'side-tools' },
          ]
        }
      }],
      stack: [{ name: 'notification-modal', routeKey: 'short' }],
    }
  };

  describe('Initialization', () => {
    const manager = new Manager({ routerTree });

    it('Initializes manager', () => {
      expect(manager).toBeInstanceOf(Manager);
    });
  
    it('Adds initial routers from router tree', () => {
      const { routers } = manager;
  
      // existence check
      expect(Object.keys(routers).length).toBe(9);
      expect(routers['root'].name).toBe('root');
      expect(routers['events'].name).toBe('events');
  
      // routeKey check
      expect(routers['notification-modal'].routeKey).toBe('short');
    });
  })

  describe('Scene template', () => {
    describe('Actions', () => {
      describe('Show', () => {
        const manager = new Manager({ routerTree });

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
        const manager = new Manager({ routerTree });

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
  })
});