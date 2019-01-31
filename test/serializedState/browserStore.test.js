import { BrowserSerializedStore } from '../../src/serializedState';

describe('Browser Serialized State', () => {
  describe('Store', () => {
    test('Setting state can mutate history ', () => {
      window.setInterval = jest.fn();
      window.history.replaceState = jest.fn();
      window.history.pushState = jest.fn();

      const store = new BrowserSerializedStore();

      const location = { pathname: ['test'], search: { param1: '2', param2: 'testparam' }, options: {}}

      store.setState(location);
      expect(window.history.pushState).toBeCalled();
    });

    test('Setting state can preserve history by replacing current state', () => {
      window.setInterval = jest.fn();
      window.history.pushState = jest.fn();
      window.history.replaceState = jest.fn();

      const store = new BrowserSerializedStore();

      const location = { pathname: ['test'], search: { param1: '2', param2: 'testparam' }, options: { replaceLocation: true }}

      store.setState(location);
      expect(window.history.replaceState).toBeCalled();
    });

    test('Can observe store state changes', () => {
      window.setInterval = jest.fn();
      window.history.pushState = jest.fn();
      window.history.replaceState = jest.fn();

      const store = new BrowserSerializedStore();

      const subscriptionOne = jest.fn();
      const subscriptionTwo = jest.fn();

      store.subscribeToStateChanges(subscriptionOne);
      const stateOne = { pathname: ['newState'], search: { param1: '2', param2: 'testparam'}, options: {}}
      window.location.search  = '?param1=2&param2=testparam';
      window.location.pathname = 'newState/';
      store.setState(stateOne);


      store.subscribeToStateChanges(subscriptionTwo);
      const stateTwo = { pathname: ['newStateOther'], search: { param1: '3', param2: undefined }, options: {}}
      window.location.search  = '?param1=3';
      window.location.pathname = 'newStateOther';
      store.setState(stateTwo);

      expect(subscriptionOne.mock.calls.length).toBe(2);
      expect(subscriptionOne.mock.calls[0][0]).toEqual(stateOne);
      expect(subscriptionOne.mock.calls[1][0]).toEqual(stateTwo);

      expect(subscriptionTwo.mock.calls.length).toBe(1);
      expect(subscriptionTwo.mock.calls[0][0]).toEqual(stateTwo);
    });

    // test('Observers are notified if the URL is updated outside the router', () => {
    //   // window.setInterval = jest.fn();
    //   window.history.pushState = jest.fn();
    //   window.history.replaceState = jest.fn();
    //   window.location.setInterval = setInterval;

    //   const store = new BrowserSerializedStore();

    //   const subscriptionOne = jest.fn();
    //   const subscriptionTwo = jest.fn();

    //   store.subscribeToStateChanges(subscriptionOne);
    //   const stateOne = { pathname: ['newState'], search: { param1: '2', param2: 'testparam'}, options: {}}
    //   window.location.search  = '?param1=2&param2=testparam';
    //   window.location.pathname = 'newState/';
    //   window.location.href = 'newState?param1=2&param2=testparam';

    //   console.log(store.stateWatcher)
    //   store.subscribeToStateChanges(subscriptionTwo);
    //   const stateTwo = { pathname: ['newStateOther'], search: { param1: '3', param2: undefined }, options: {}}
    //   window.location.search  = '?param1=3';
    //   window.location.pathname = 'newStateOther';
    //   window.location.href = 'newStateOther?param1=3';

    //   expect(subscriptionOne.mock.calls.length).toBe(2);
    //   expect(subscriptionOne.mock.calls[0][0]).toEqual(stateOne);
    //   expect(subscriptionOne.mock.calls[1][0]).toEqual(stateTwo);

    //   expect(subscriptionTwo.mock.calls.length).toBe(1);
    //   expect(subscriptionTwo.mock.calls[0][0]).toEqual(stateTwo);
    // })
  });

  describe('History', () => {
    window.setInterval = jest.fn();
    // window.history.pushState = jest.fn();
    // window.history.replaceState = jest.fn();
    const store = new BrowserSerializedStore();
    
    it('Can move forward', () => {
      window.history.forward = jest.fn();
      store.forward();
      expect(window.history.forward).toBeCalled();
    });

    it('Can move backward', () => {
      window.history.back = jest.fn();
      store.back();
      expect(window.history.back).toBeCalled();
    });

    it('Can move to a specific point in history', () => {
      window.history.go = jest.fn();
      store.go(-1);
      expect(window.history.go).toBeCalledWith(-1);
    });
  });
});