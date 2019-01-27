import RouterStateAdapater, { defaultStore } from '../src/routerState';


describe('Router State', () => {
  describe('Adapter', () => {
    test('Uses a default object store', () => {
      const adapter = new RouterStateAdapater();
      expect(adapter.getState()).toEqual({});
      expect(adapter.getState()).toBe(defaultStore);
    });

    test('Can write to store', () => {
      const store = {};
      const adapter = new RouterStateAdapater(store);

      const rootState = { visible: true, order: 0 };
      const firstSceneState = { visible: false, flow: 'wild' };
      const routers = { 
        root: rootState,
        firstScene: firstSceneState,
      };

      adapter.setState(routers);
      expect(adapter.getState()).toEqual({
        root: { current: rootState, historical: [{}] },
        firstScene: { current: firstSceneState, historical: [{}] },
      });
    });

    test('Can store history', () => {
      const store = {};
      const adp = new RouterStateAdapater(store);

      const rootState_one = { visible: true, order: 0 };
      const rootState_two = { visible: false, order: 1 };

      const firstSceneState_one = { visible: false, flow: 'wild' };
      const firstSceneState_two = { visible: true, flow: 'calm' };

      adp.setState({ 
        root: rootState_one,
        firstScene: firstSceneState_one,
      });

      adp.setState({ 
        root: rootState_two,
        firstScene: firstSceneState_two,
      });

      expect(adp.getState()).toEqual({
        root: { current: rootState_two, historical: [rootState_one, {}] },
        firstScene: { current: firstSceneState_two, historical: [firstSceneState_one, {}] },
      });
    });

    test('Can set and maintain history size', () => {
      const store = {};
      const adp = new RouterStateAdapater(store, { historySize: 3 });

      [1, 2, 3, 4, 5, 6].forEach((order) => {
        adp.setState({ root: { visible: true, order }});
      });

      expect(adp.getState()).toEqual({
        root: { 
          current: { visible: true, order: 6 }, 
          historical: [
            { visible: true, order: 5 },
            { visible: true, order: 4 },
            { visible: true, order: 3 },
          ]
        }
      })
    })
  });
});

