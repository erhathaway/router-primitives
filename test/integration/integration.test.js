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
      it('On pathRouter child of rootRouter', () => {
        userRouter.show();
        userRouter.show();

        expect(userObserver.mock.calls[0][0]).toEqual({ current: { visible: true }, historical: [{}] });
      });

      // it('On non pathRouter child of rootRouter', () => {
      //   toolbarRouter.show();
      //   expect(toolbarObserver.mock.calls[0][0]).toEqual({ current: { visible: true }, historical: [{}] });
      // })
    });

  })
  
});