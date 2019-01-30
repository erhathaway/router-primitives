import { NativeSerializedStore } from '../../src/serializedState';


describe('Native Serialized State', () => {
  describe('Adapter', () => {
    const adapter = new NativeSerializedStore();

    test('Uses a default string store', () => {
      expect(adapter.getState()).toEqual({ pathname: [''], search: {}, options: {} });
    });

    test('Can write to store', () => {
      const location = { pathname: ['test'], search: { param1: '2', param2: 'testparam'}, options: {}}
      adapter.setState(location);

      expect(adapter.getState()).not.toBe(location);
      expect(adapter.getState()).toEqual(location);
    });

    test('Can observe store state changes', () => {
      const subscriptionOne = jest.fn();
      const subscriptionTwo = jest.fn();

      adapter.subscribeToStateChanges(subscriptionOne);
      const stateOne = { pathname: ['newState'], search: { param1: '2', param2: 'testparam'}, options: {}}
      adapter.setState(stateOne);


      adapter.subscribeToStateChanges(subscriptionTwo);

      const stateTwo = { pathname: ['newStateOther'], search: { param1: '3' }, options: {}}
      adapter.setState(stateTwo);
      expect(subscriptionOne.mock.calls.length).toBe(2);
      expect(subscriptionOne.mock.calls[0][0]).toEqual(stateOne);
      expect(subscriptionOne.mock.calls[1][0]).toEqual(stateTwo);

      expect(subscriptionTwo.mock.calls.length).toBe(1);
      expect(subscriptionTwo.mock.calls[0][0]).toEqual(stateTwo);
    });
  });
});

