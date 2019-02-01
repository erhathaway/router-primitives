import Manager from '../../src/manager';
import { NativeSerializedStore, BrowserSerializedStore } from '../../src/serializedState';
import RouterStore from '../../src/routerState';

describe('Router Manager', () => {
  const routerTree = {
    name: 'root',
    routers: {
      scene: [
        { name: 'user',
          routers: {
            scene: [{ name: 'events' }, { name: 'details' }],
          },
        },
        { name: 'info' }],
      feature: [{ name: 'toolbar' }],
      stack: [{ name: 'notification-modal' }],
    }
  };

  describe('Initialization', () => {
    test('Defaults to serialized and router stores', () => {
      const manager = new Manager();
      
      expect(manager.serializedStateStore).toBeInstanceOf(NativeSerializedStore);
      expect(manager.routerStateStore).toBeInstanceOf(RouterStore);
    });

    test('Can add a router tree', () => {
      const manager = new Manager({ routerTree });

      expect(Object.keys(manager.routers).length).toBe(7);
      expect(manager.rootRouter.name).toBe('root');
      expect(manager.routers['info'].name).toBe('info');
      expect(manager.routers['events'].parent.name).toBe('user');
      expect(manager.routers['root'].routers['scene'].length).toBe(2);
    });

    describe('Serialized Store defaults', () => {
      describe('No window object (Non broser env)', () => {
        it('uses nativeStore', () => {
          const manager = new Manager({ routerTree });
          
          expect(manager.serializedStateStore).toBeInstanceOf(NativeSerializedStore);
        });
      });

      describe('With window object (Browser env)', () => {
        it('uses browserStore', () => {
          global.window = { setInterval: jest.fn(), history: {}, location: {} };
          const manager = new Manager({ routerTree });

          expect(manager.serializedStateStore).toBeInstanceOf(BrowserSerializedStore);

          delete global.window;
        });
      })
    });
  });

  describe('Adding and removing routers', () => {
    describe('Initialized with routers', () => {
      const manager = new Manager({ routerTree });

      it('then had a router added', () => {
        const newRouter = {
          name: 'admin',
          type: 'scene',
          parentName: 'user',
        };
    
        manager.addRouter(newRouter);

        expect(Object.keys(manager.routers).length).toBe(8);
        expect(manager.routers['user'].routers.scene.length).toBe(3);
        expect(manager.routers['admin'].name).toBe('admin');
        expect(manager.routers['admin'].parent).toBe(manager.routers['user']);
      });

      it('then had a router removed', () => {
        manager.removeRouter('admin');
    
        expect(Object.keys(manager.routers).length).toBe(7);
        expect(manager.routers['user'].routers.scene.length).toBe(2);
        expect(manager.routers['admin']).toBe(undefined);
      });

      it('had a router with child routers removed', () => {
        expect(manager.routers['events'].name).toBe('events');
        expect(manager.routers['details'].name).toBe('details');

        manager.removeRouter('user');

        expect(Object.keys(manager.routers).length).toBe(4);
        expect(manager.routers['user']).toBe(undefined);
        expect(manager.routers['events']).toBe(undefined);
        expect(manager.routers['details']).toBe(undefined);
      });
    });

    describe('Not initialized with routers', () => {
      const manager = new Manager();

      it('had one router added', () => {
        expect(Object.keys(manager.routers).length).toBe(0);

        const newRouter = {
          name: 'admin',
        };
    
        manager.addRouter(newRouter);

        expect(Object.keys(manager.routers).length).toBe(1);
        expect(manager.rootRouter.name).toBe('admin');
      });

      it('had two routers added', () => {
        const newRouter = {
          name: 'admin-tools',
          parentName: 'admin',
          type: 'feature',
        };

        manager.addRouter(newRouter);

        expect(Object.keys(manager.routers).length).toBe(2);
        expect(manager.routers['admin'].routers.feature.length).toBe(1);
        expect(manager.routers['admin-tools'].name).toBe('admin-tools');
        expect(manager.routers['admin-tools'].parent).toBe(manager.routers['admin']);
      });
    });

    describe('Subscribing to a routers state', () => {
      const manager = new Manager({ routerTree });

      it('issues state updates', () => {
        const userObserverFn = jest.fn();
        const secondUserObserverFn = jest.fn();
        const rootObserverFn = jest.fn();

        const initialRoutersState = {
          user: { visible: false, order: 1 },
          root: { visible: true, order: 22 },
        }

        manager.routerStateStore.setState(initialRoutersState);

        manager.routers['user'].subscribe(userObserverFn);
        manager.routers['user'].subscribe(secondUserObserverFn);
        manager.routers['root'].subscribe(rootObserverFn);

        const location = { pathname: ['test'], search: { param1: '2', param2: 'testparam'}, options: {}}
        manager.serializedStateStore.setState(location);

        expect(userObserverFn.mock.calls[0][0]).toEqual({ current: { visible: false }, historical: [{ visible: false, order: 1 }] });
        expect(userObserverFn.mock.calls.length).toEqual(1);

        expect(secondUserObserverFn.mock.calls[0][0]).toEqual({ current: { visible: false }, historical: [{ visible: false, order: 1 }] });
        expect(secondUserObserverFn.mock.calls.length).toEqual(1);

        expect(rootObserverFn.mock.calls[0][0]).toEqual({ current: { visible: false }, historical: [{ visible: true, order: 22 }] });
        expect(rootObserverFn.mock.calls.length).toEqual(1);
      });
    });

    describe('Fetching a routers state', () => {
      const manager = new Manager({ routerTree });

      it('returns the state for only the router', () => {
        const initialRoutersState = {
          user: { visible: false, order: 1 },
          root: { visible: true, order: 22 },
        }

        manager.routerStateStore.setState(initialRoutersState);
        
        expect(manager.routers['user'].getState()).toEqual({ current: { visible: false, order: 1 }, historical: [] });
      })
    })
  });
});
