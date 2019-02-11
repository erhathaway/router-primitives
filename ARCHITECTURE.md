# Manager

A manager coordinates:
- Is specified by a:
  - serialized state adapter
  - optional router state adapter
  - router factory

Allows you to create your own methods that specify:
// Setting state
- setRouterState (newRouterState) -> updated router state
- createRouter({ name, routeKey, config, default, type, parent: parentName }) -> router

// Creating actions
- serializedSore.setState


API 
serializedStore
  # getState
  # setState
  # subscribe
  # unsubscribe

routerStore
  # getState () => { routerName: state }
  # setState { routerName: state } => ()
  # createRouterStateGetter (routerName) -> routerState
  # createRouterStateSubscriber (routerName) -> (routerState) => ()