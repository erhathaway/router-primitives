const show = (location, router, ctx) => {
  if (router.isPathRouter) {
    const parent = router.parent;
    if (!parent || (!parent.state.visible && !parent.isRootRouter)) { return location; }

    location.pathname[router.pathLocation] = router.routeKey;

  } else {
    location.search[router.routeKey] = true;
  }

  return location;
};

const hide = (location, router, ctx) => {
  return location;
};

const reducer = (location, router, ctx) => {
  // console.log('-----------------------------')
  const newState = {};
  if (router.isPathRouter) {
    location.pathname[router.pathLocation] === router.routeKey
      ? newState['visible'] = true
      : newState['visible'] = false
  } else {
    location.search[router.routeKey] === 'true'
      ? newState['visible'] = true
      : newState['visible'] = false
  }
  // console.log('new state', router.pathLocation, location, newState)
  // if (router.routeKey === 'toolbar') {
  //   console.log('newState', router.routeKey, newState, router.routeKey, router.pathLocation)
  //   console.log('user location', location)
  // }
  return newState;
};

const defaultState = {
  visible: 'lala',
}

const parser = () => {
  
}

const scene = {
  actions: { show, hide },
  state: defaultState,
  reducer,
  parser,
}

export default scene;