import Manager from '../../src/manager';

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
      expect(Object.keys(routers)).toHaveLength(9);
      expect(routers['root'].name).toBe('root');
      expect(routers['events'].name).toBe('events');
  
      // routeKey check
      expect(routers['notification-modal'].routeKey).toBe('short');
    });
  });
});