import { NativeSerializedStore } from '../../src/serializedState';


describe('Native Serialized State', () => {
  describe('Adapter', () => {
    test('Uses a default string store', () => {
      const adapter = new NativeSerializedStore();
      expect(adapter.getState()).toEqual({ pathname: [], search: {}, options: {} });
    });

    test('Can write to store', () => {
      const adapter = new NativeSerializedStore();
      const location = { pathname: ['test'], search: { param1: '2', param2: 'testparam'}, options: {}}
      adapter.setState(location);

      expect(adapter.getState()).not.toBe(location);
      expect(adapter.getState()).toEqual(location);
    });

    test('Can observe store state changes', () => {
      const adapter = new NativeSerializedStore();
      const subscriptionOne = jest.fn();
      const subscriptionTwo = jest.fn();

      adapter.subscribeToStateChanges(subscriptionOne);
      const stateOne = { pathname: ['newState'], search: { param1: '2', param2: 'testparam'}, options: {}}
      adapter.setState(stateOne);


      adapter.subscribeToStateChanges(subscriptionTwo);

      const stateTwo = { pathname: ['newStateOther'], search: { param1: '3', param2: undefined }, options: {}}
      adapter.setState(stateTwo);
      expect(subscriptionOne.mock.calls.length).toBe(2);
      expect(subscriptionOne.mock.calls[0][0]).toEqual(stateOne);
      expect(subscriptionOne.mock.calls[1][0]).toEqual(stateTwo);

      expect(subscriptionTwo.mock.calls.length).toBe(1);
      expect(subscriptionTwo.mock.calls[0][0]).toEqual(stateTwo);
    });

    test('Use the previous location to fill in missing queryParams when saving a new location', () => {
      const adapter = new NativeSerializedStore();
      const subscription = jest.fn();
      adapter.subscribeToStateChanges(subscription);

      const stateOne = { pathname: ['here/newState'], search: { param1: '2', param2: 'testparam'}}
      adapter.setState(stateOne);

      const stateTwo = { pathname: ['there'], search: { param1: '3' }}
      adapter.setState(stateTwo);

      expect(subscription.mock.calls[0][0]).toEqual({ pathname: ['here', 'newState'], search: { param1: '2', param2: 'testparam'}, options: {}});
      expect(subscription.mock.calls[1][0]).toEqual({ pathname: ['there'], search: { param1: '3', param2: 'testparam'}, options: {}});
    });
  });
});

