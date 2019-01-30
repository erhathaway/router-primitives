// /**
//  * Default serialized state store is a string
//  * TODO make this platform dependent or configerable via config
//  *   - If on web, use web URL
//  *   - If not on web (ex react native), use string
//  */
// // export let defaultStore = ''; // eslint-disable-line

// /**
//  * The adapter that the router manager uses to write and read from the serialized state store
//  * The serialized state store is what, on the web, holds the URL - aka the serilaized state of the router tree
//  */
// export default class DefaultSerializedStateAdapter {
//   constructor(store = '', config = {}) {
//     this.store = store;
//     this.observers = [];
//   }

//   setState(state) { 
//     this.store = state;
//     this.observers.forEach(fn => fn(this.store) );
//   }

//   getState() { return this.store; }

//   subscribeToStateChanges(fn) { this.observers.push(fn); }
// }