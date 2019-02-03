import Manager from '../../../src/manager';

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
      stack: [
        { name: 'welcome-modal', 
          routers: {
            stack: [{ name: 'cookies-popup', routeKey: 'short' }],
            scene: [
              { name: 'welcome-main' }, // non-pathRouter scene
              { name: 'welcome-end' },
            ],
          },
        },
        { name: 'cookies-modal' },
        { name: 'data-modal' },
      ],
    }
  };

  describe('Scene template', () => {
    describe('Actions', () => {  
      it('Show sets order to 1 if the only stack router', () => {
        const manager = new Manager({ routerTree });
        const welcomeObserver = jest.fn();
        const welcomeRouter = manager.routers['welcome-modal'];
        welcomeRouter.subscribe(welcomeObserver);

        welcomeRouter.show();

        expect(welcomeRouter.isPathRouter).toBe(false);
        expect(welcomeObserver.mock.calls[0][0]).toEqual({ current: { order: '1', visible: true }, historical: [] });

        welcomeRouter.show();

        // second action call should do nothing since its idential to the first
        expect(welcomeObserver.mock.calls[1]).toBe(undefined);
      });

      it('Hide sets order to undefined if the only stack router', () => {
        const manager = new Manager({ routerTree });
        const welcomeObserver = jest.fn();
        const welcomeRouter = manager.routers['welcome-modal'];
        welcomeRouter.subscribe(welcomeObserver);

        welcomeRouter.show();
        welcomeRouter.hide();

        expect(welcomeRouter.isPathRouter).toBe(false);
        expect(welcomeObserver.mock.calls[1][0]).toEqual({ current: { order: undefined, visible: false }, historical: [{ order: '1', visible: true}] });

        welcomeRouter.hide();

        // second action call should do nothing since its idential to the first
        expect(welcomeObserver.mock.calls[2]).toBe(undefined);
      });

      it('"Show" and "Hide" with existing stacks change ordering', () => {
        const manager = new Manager({ routerTree });
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

        expect(dataObserver.mock.calls[0][0].current).toEqual({ order: '1', visible: true });
        expect(dataObserver.mock.calls[1][0].current).toEqual({ order: '2', visible: true });
        expect(dataObserver.mock.calls[2][0].current).toEqual({ order: '3', visible: true });

        expect(welcomeObserver.mock.calls[2][0].current).toEqual({ order: '2', visible: true });
        expect(cookiesObserver.mock.calls[1][0].current).toEqual({ order: '1', visible: true });

        cookiesRouter.show();

        // second action call should do nothing since its idential to the first
        expect(cookiesObserver.mock.calls[2]).toBe(undefined);

        welcomeRouter.show();

        expect(welcomeObserver.mock.calls[3][0].current).toEqual({ order: '1', visible: true });
        expect(cookiesObserver.mock.calls[2][0].current).toEqual({ order: '2', visible: true });

        // hasn't changed state even though the ordering of the other two routers have
        expect(dataObserver.mock.calls[3]).toBe(undefined);
        expect(dataObserver.mock.calls[2][0].current).toEqual({ order: '3', visible: true });

        welcomeRouter.hide();

        expect(welcomeObserver.mock.calls[4][0].current).toEqual({ order: undefined, visible: false });
        expect(cookiesObserver.mock.calls[3][0].current).toEqual({ order: '1', visible: true });
        expect(dataObserver.mock.calls[3][0].current).toEqual({ order: '2', visible: true });
      });

      it('Movement actions work - forward, backwards, toFront, toBack', () => {
        const manager = new Manager({ routerTree });
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
        welcomeRouter.toFront();
        cookiesRouter.toFront();

        expect(dataObserver.mock.calls[0][0].current).toEqual({ order: '1', visible: true });
        expect(dataObserver.mock.calls[1][0].current).toEqual({ order: '2', visible: true });
        expect(dataObserver.mock.calls[2][0].current).toEqual({ order: '3', visible: true });

        expect(welcomeObserver.mock.calls[2][0].current).toEqual({ order: '2', visible: true });
        expect(cookiesObserver.mock.calls[1][0].current).toEqual({ order: '1', visible: true });

        dataRouter.toFront();

        expect(dataObserver.mock.calls[3][0].current).toEqual({ order: '1', visible: true });
        expect(welcomeObserver.mock.calls[3][0].current).toEqual({ order: '3', visible: true });
        expect(cookiesObserver.mock.calls[2][0].current).toEqual({ order: '2', visible: true });

        dataRouter.toBack();

        expect(dataObserver.mock.calls[4][0].current).toEqual({ order: '3', visible: true });
        expect(welcomeObserver.mock.calls[4][0].current).toEqual({ order: '2', visible: true });
        expect(cookiesObserver.mock.calls[3][0].current).toEqual({ order: '1', visible: true });

        welcomeRouter.toBack();

        expect(dataObserver.mock.calls[5][0].current).toEqual({ order: '2', visible: true });
        expect(welcomeObserver.mock.calls[5][0].current).toEqual({ order: '3', visible: true });
        expect(cookiesObserver.mock.calls[4]).toBe(undefined);

        welcomeRouter.forward();

        expect(dataObserver.mock.calls[6][0].current).toEqual({ order: '3', visible: true });
        expect(welcomeObserver.mock.calls[6][0].current).toEqual({ order: '2', visible: true });
        expect(cookiesObserver.mock.calls[4]).toBe(undefined);

        welcomeRouter.backward();

        expect(dataObserver.mock.calls[7][0].current).toEqual({ order: '2', visible: true });
        expect(welcomeObserver.mock.calls[7][0].current).toEqual({ order: '3', visible: true });
        expect(cookiesObserver.mock.calls[4]).toBe(undefined);

        cookiesRouter.backward();

        expect(dataObserver.mock.calls[8][0].current).toEqual({ order: '1', visible: true });
        expect(welcomeObserver.mock.calls[8]).toBe(undefined);
        expect(cookiesObserver.mock.calls[4][0].current).toEqual({ order: '2', visible: true });
      });
    });
  });
});