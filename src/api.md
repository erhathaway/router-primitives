

# siblings() => []
# sbilingsByType([types]) => { type: [], etc... }

# hasParent
# parent
# children
# childrenByType([types])
# parentHasState({ key: value })
# this.hasState({ })

# isPathRouter

#pathNamePosition
# clearPathUpToPosition(path arr, position)


router manager 
-> maintains references to routers
-> adds or removes routers
  -> multiple ones on init
  -> single ones after init

<!-- stateStore = (initialRouterStates) => (newRouterState) -->
createAppRouter = (initialRouters = {}, stateStore) = {
  const routerConfigArray = reduceOverStateTreeToGenerateRouterConfigArray(initialRouters)
  const initalizedStateStore = addInitialStateFromRouterConfigToStateStore(routerConfigArray, stateStore)

  this.routers
  this.add
}

<!-- RouterStateStore -->
class RouterStateStore {
  constructor(stateStorageFunction, stateRetrievalFunction) {}

  getCurrentState
    stateRetrievalFunction()

  setNewState{state: { routerName: {} }}
    stateStorageFunction(state)
}



<!-- Router Manager -->
class RouterManager {
  constructor(stateStore) {
    -> hold ref to stateStore in this.routersState
  }

  addRouters = (routerTreeConfig = {}) => reduceOverRouterTreeConfig -> generateRouterConfigArray -> for each router config, call this.addRouter)
    -> reduce over tree
    -> for each node, call this.generate router config
    -> for each router config, call this.addRouter

  addRouter => (routerConfig = {}) -> 
    -> for routerConfig call createRouter
    -> createRouter by type and add to this.routers 

  removeRouter(name)
    -> remove router from this.routerState

  this.routers
}

class Router {
  constructor() {
    [methods].forEach make wrapper method
  }
  _routerInternal_
    -> 

  
  if method call in list of method calls, call internal objects method
}

routers 
-> maintains references to parent
-> maintains references to children and router types
-> keeps track of its type

routerType =
-> maps methods 
  (action -> reducer)
  (direct method call)
  (mobx method call)

-> maps getState
  -> access redux
  -> gets state from mobx or regular obj
-> handles state subscription


getCurrentRoutersState -> calc new router states -> (action or direct to storec) update existing router state


treeStateStore 
-> access function to write new serialized state
-> access function to observe changes to serialized state
-> stores serialized tree state
-> changes to state notify routerManager

vs
routerStateStore (see below)
-> stores router states


stateAdapter configs:  
signature: stateAdapter(store) -> initAdapter

routerManager(initAdapter)

router provides state getter from store
  -> redux getter
  -> obj getter
router provides history getter from store
  -> redux getter
  -> obj getter

router tree state to store
  -> redux action
  -> direct write to store obj

<Router type="..." >
 { { parent, siblings, methods..., state, history[] } =>

 }
</>



mamanger subscribes to store
-> iterates over all updates via the tree shape, notifying of updates



PAGE_ROUTER

PAGE_ROUTER
state
  -> front=number
  -> back=number
  -> focused=number
methods
  -> stepForward(steps)
  -> stepBackward(steps)
config
  -> minSteps=number|null === none
  -> maxSteps=number|null === none


<isFront=true>
<isBack=true>
<isFocused=true>


TableRouter
state
  -> data=table
methods
  -> setData


Architecture:

RouterModel - defines the types of routers
Router - is what a type is made into. implements the consumer interface (parent, siblings, state, history, methods... etc)
RouterManager - is what handles addition and removal of routers based on router models. also orcestrates connecting state stores to routers via adapters

SerializedStateStore - url location
SerializedStateAdapter
RouterStateStore - router location
RouterStateAdapter