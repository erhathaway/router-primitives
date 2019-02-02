// takes an object of keys where the value's
// represent order and turns it into an array of ordered keys
function getRouteKeyOrderings(router) {
  const routeKeyOrderObj = routerouter.parent.routers[router.type].map(r => {
    if (r.state.visible === false) { return undefined; }
    return { [r.routeKey]: r.state.order }
  }).filter(obj => !!obj);

  /*
    { <routeKeyName>: <order> }
  */

  // reduce the order object to the array of sorted keys
  const routerRouteKeys = Object.keys(routeKeyOrderObj);
  /* reorder routeKeyOrderObj by order
    ex: { <order>: <routeKeyName> }
  */
  const orderAsKey = routerRouteKeys.reduce((acc, key) => {
    const value = routeKeyOrderObj[key];
    if (value != null && !Number.isNaN(value)) {
      acc[routeKeyOrderObj[key]] = key;
    }
    return acc;
  }, {});

  const orders = Object.values(routeKeyOrderObj);
  const filteredOrders = ((orders.filter(n => n != null && !Number.isNaN(n)): any): Array<number>);
  const sortedOrders = filteredOrders.sort((a, b) => a - b);
  const sortedKeys = sortedOrders.map(order => orderAsKey[order]);
  return sortedKeys;
}

const show = (location, router, ctx) => {
  if (!router.parent) { return location; }

  const sortedKeys = getRouteKeyOrderings(router);

  // find index of this routers routeKey
  const index = sortedKeys.indexOf(this.routeKey);
  if (index > -1) {
    // remove routeKey if it exists
    sortedKeys.splice(index, 1);
  }
  // add route key to front of sorted keys
  sortedKeys.unshift(this.routeKey);

  // create search object
  const search = sortedKeys.reduce((acc, key, i) => {
    acc[key] = i + 1;
    return acc;
  }, {});

  location.search = { ...location.search, ...search };
    // const { options } = this.constructor.updateSetLocationOptions(location, { mutateExistingLocation: this.mutateLocationOnStackUpdate });

    // return { pathname: location.pathname, search, options };
  return location;
};

const hide = (location, router, ctx) => {
  if (!this.parent) return location;

  const sortedKeys = getRouteKeyOrderings(router);

  // find index of this routers routeKey
  const index = sortedKeys.indexOf(this.routeKey);
  if (index > -1) {
    // remove routeKey if it exists
    sortedKeys.splice(index, 1);
  }

  // create router type data obj
  const search = sortedKeys.reduce((acc, key, i) => {
    acc[key] = i + 1;
    return acc;
  }, {});
  // remove this routeKey from the router type search
  search[this.routeKey] = undefined;

  location.search = { ...location.search, ...search };

  // const { options } = this.constructor.updateSetLocationOptions(location, { mutateExistingLocation: this.mutateLocationOnStackUpdate });

  // return { pathname: location.pathname, search, options };
  return location;
};

const moveForward = (location, router, ctx) => {
  if (!this.parent) return location;

  const sortedKeys = getRouteKeyOrderings(router);

  // find index of this routers routeKey
  const index = sortedKeys.indexOf(this.routeKey);
  if (index > -1) {
    // remove routeKey if it exists
    sortedKeys.splice(index, 1);
  }

  // move routeKey router forward by one in the ordered routeKey list
  const newIndex = index >= 1 ? index - 1 : 0;
  sortedKeys.splice(newIndex, 0, this.routeKey);

  // create router type data obj
  const search = sortedKeys.reduce((acc, key, i) => {
    acc[key] = i + 1;
    return acc;
  }, {});

  // const { options } = this.constructor.updateSetLocationOptions(location, { mutateExistingLocation: this.mutateLocationOnStackUpdate });


  // return { pathname: location.pathname, search, options };
  location.search = { ...location.search, ...search };

  // const { options } = this.constructor.updateSetLocationOptions(location, { mutateExistingLocation: this.mutateLocationOnStackUpdate });

  // return { pathname: location.pathname, search, options };
  return location;
}

const moveBackward = (location, router, ctx) => {
  if (!this.parent) return location;

  const sortedKeys = getRouteKeyOrderings(router);

  // find index of this routers routeKey
  const index = sortedKeys.indexOf(this.routeKey);
  if (index > -1) {
    // remove routeKey if it exists
    sortedKeys.splice(index, 1);
  }

  // move routeKey router backward by one in the ordered routeKey list
  const newIndex = index + 1;
  sortedKeys.splice(newIndex, 0, this.routeKey);

  // create router type data obj
  const search = sortedKeys.reduce((acc, key, i) => {
    acc[key] = i + 1;
    return acc;
  }, {});

  // const { options } = this.constructor.updateSetLocationOptions(location, { mutateExistingLocation: this.mutateLocationOnStackUpdate });

  // return { pathname: location.pathname, search, options };
  // return { pathname: location.pathname, search, options };
  location.search = { ...location.search, ...search };

  // const { options } = this.constructor.updateSetLocationOptions(location, { mutateExistingLocation: this.mutateLocationOnStackUpdate });

  // return { pathname: location.pathname, search, options };
  return location;
}

const bringToFront = (location, router, ctx) => {
  // const newLocation = this.constructor.updateSetLocationOptions(location, { mutateExistingLocation: this.mutateLocationOnStackUpdate });

  router.show(location, router, ctx);
}

const sendToBack = (location, router, ctx) => {
  if (!this.parent) return location;

  const sortedKeys = getRouteKeyOrderings(router);

  // find index of this routers routeKey
  const index = sortedKeys.indexOf(this.routeKey);
  if (index > -1) {
    // remove routeKey if it exists
    sortedKeys.splice(index, 1);
  }

  // add to back of stack
  sortedKeys.push(this.routeKey);

  // create router type data obj
  const search = sortedKeys.reduce((acc, key, i) => {
    acc[key] = i + 1;
    return acc;
  }, {});

  // const { options } = this.constructor.updateSetLocationOptions(location, { mutateExistingLocation: this.mutateLocationOnStackUpdate });

  // return { pathname: location.pathname, search, options };
  location.search = { ...location.search, ...search };

  // const { options } = this.constructor.updateSetLocationOptions(location, { mutateExistingLocation: this.mutateLocationOnStackUpdate });

  // return { pathname: location.pathname, search, options };
  return location;
}



const reducer = (location, router, ctx) => {
  const newState = {};

  const value = location.search[router.routeKey];

  if (value) {
    return {
      visible: true,
      order: value,
    }
  }

  return {
    visible: false,
    order: undefined,
  }
  // if (router.isPathRouter) {
  //   newState['visible'] = location.pathname[router.pathLocation] === router.routeKey;
  // } else {
  //   newState['visible'] = location.search[router.routeKey] === 'true';
  // }

  // return newState;
};


// TODO figure out what to do about default states
const defaultState = {
  visible: 'lala',
};

const parser = () => {
  
}

const stack = {
  actions: { show, hide, moveForward, moveBackward, bringToFront, sendToBack },
  state: defaultState,
  reducer,
  parser,
};

export default stack;