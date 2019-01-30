import SerializedStateAdapter, { defaultStore } from '../src/serializedState';


describe('Serialized State', () => {
  describe('Adapter', () => {
    const adapter = new SerializedStateAdapter();

    test('Uses a default string store', () => {
      expect(adapter.getState()).toBe('');
    });

    test('Can write to store', () => {
      adapter.setState('hello');
      expect(adapter.getState()).toBe('hello');
    });

    test('Can observe store state changes', () => {
      const subscriptionOne = jest.fn();
      const subscriptionTwo = jest.fn();

      adapter.subscribeToStateChanges(subscriptionOne);
      adapter.setState('newState');

      adapter.subscribeToStateChanges(subscriptionTwo);

      adapter.setState('otherState');
      expect(subscriptionOne.mock.calls.length).toBe(2);
      expect(subscriptionOne.mock.calls[0][0]).toBe('newState');
      expect(subscriptionOne.mock.calls[1][0]).toBe('otherState');

      expect(subscriptionTwo.mock.calls.length).toBe(1);
      expect(subscriptionTwo.mock.calls[0][0]).toBe('otherState');
    });
  });
});

