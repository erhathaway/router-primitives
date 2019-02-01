import Manager from '../../src/manager';
import { NativeSerializedStore, BrowserSerializedStore } from '../../src/serializedState';
import RouterStore from '../../src/routerState';

describe('Integration', () => {
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

  const manager = new Manager({ routerTree });

  it('Initializes manager', () => {
    expect(manager).toBeInstanceOf(Manager);
  });

  it('Adds initial routers from router tree', () => {
    const { routers } = manager;

    expect(Object.keys(routers).length).toBe(7);
    expect(routers['root'].name).toBe('root');
    expect(routers['events'].name).toBe('events');
  });

  describe('Using router actions', () => {
    const userObserver = jest.fn();
    const userRouter = manager.routers['user'];
    userRouter.subscribe(userObserver);

    const toolbarObserver = jest.fn();
    const toolbarRouter = manager.routers['toolbar'];
    toolbarRouter.subscribe(toolbarObserver);

    
    describe('Show action', () => {
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
        expect(toolbarRouter.isPathRouter).toBe(false);

        // should have a history of 1 b/c the userRouter.show() caused the router tree to reduce state when toolbar wasn't visible
        expect(toolbarObserver.mock.calls[0][0]).toEqual({ current: { visible: true }, historical: [{ visible: false }] });
      })
    });

  });
});