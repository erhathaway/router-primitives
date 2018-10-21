import { extractStack } from './utils/extractLocation';

import type {
  RouterContext,
  Location,
  RouterState,
} from '../types';


// takes an object of keys where the value's
// represent order and turns it into an array of ordered keys
function orderStackRouteKeys(routeKeyOrderObj: { [string]: number }): Array<string> {
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

/**
 * Mixins that give the base router FeatureRouting functionality
 * Notably, a feature router needs specific #showFeature, #hideFeature, and #updateFeature methods
*/
export default {

  /* STACK SPECIFIC */

  showStack(location: Location): Location {
    if (!this.parent) return location;

    // get routeKeys that belong to this router type
    const typeRouterRouteKeys = this.parent.routers[this.type].map(t => t.routeKey);
    // get current order for all routeKeys via the location state
    const routerTypeData = extractStack(location, typeRouterRouteKeys);
    const sortedKeys = orderStackRouteKeys(routerTypeData);


    // find index of this routers routeKey
    const index = sortedKeys.indexOf(this.routeKey);
    if (index > -1) {
      // remove routeKey if it exists
      sortedKeys.splice(index, 1);
    }
    // add route key to front of sorted keys
    sortedKeys.unshift(this.routeKey);

    // create router type data obj
    const search = sortedKeys.reduce((acc, key, i) => {
      acc[key] = i + 1;
      return acc;
    }, {});

    const { options } = this.constructor.updateSetLocationOptions(location, { mutateExistingLocation: this.mutateLocationOnStackUpdate });

    return { pathname: location.pathname, search, options };
  },

  hideStack(location: Location): Location {
    if (!this.parent) return location;

    // get routeKeys that belong to this router type
    const typeRouterRouteKeys = this.parent.routers[this.type].map(t => t.routeKey);
    // get current order for all routeKeys via the location state
    const routerTypeData = extractStack(location, typeRouterRouteKeys);
    const sortedKeys = orderStackRouteKeys(routerTypeData);

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
    const { options } = this.constructor.updateSetLocationOptions(location, { mutateExistingLocation: this.mutateLocationOnStackUpdate });

    return { pathname: location.pathname, search, options };
  },

  moveForwardStack(location: Location): Location {
    if (!this.parent) return location;

    // get routeKeys that belong to this router type
    const typeRouterRouteKeys = this.parent.routers[this.type].map(t => t.routeKey);
    // get current order for all routeKeys via the location state
    const routerTypeData = extractStack(location, typeRouterRouteKeys);
    const sortedKeys = orderStackRouteKeys(routerTypeData);


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

    const { options } = this.constructor.updateSetLocationOptions(location, { mutateExistingLocation: this.mutateLocationOnStackUpdate });


    return { pathname: location.pathname, search, options };
  },

  moveBackwardStack(location: Location): Location {
    if (!this.parent) return location;

    // get routeKeys that belong to this router type
    const typeRouterRouteKeys = this.parent.routers[this.type].map(t => t.routeKey);
    // get current order for all routeKeys via the location state
    const routerTypeData = extractStack(location, typeRouterRouteKeys);
    const sortedKeys = orderStackRouteKeys(routerTypeData);


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

    const { options } = this.constructor.updateSetLocationOptions(location, { mutateExistingLocation: this.mutateLocationOnStackUpdate });

    return { pathname: location.pathname, search, options };
  },

  bringToFrontStack(location: Location): Location {
    const newLocation = this.constructor.updateSetLocationOptions(location, { mutateExistingLocation: this.mutateLocationOnStackUpdate });

    return this.showStack(newLocation);
  },

  sendToBackStack(location: Location): Location {
    if (!this.parent) return location;

    // get routeKeys that belong to this router type
    const typeRouterRouteKeys = this.parent.routers[this.type].map(t => t.routeKey);
    // get current order for all routeKeys via the location state
    const routerTypeData = extractStack(location, typeRouterRouteKeys);
    const sortedKeys = orderStackRouteKeys(routerTypeData);

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

    const { options } = this.constructor.updateSetLocationOptions(location, { mutateExistingLocation: this.mutateLocationOnStackUpdate });

    return { pathname: location.pathname, search, options };
  },

  updateStack(parentState: RouterState, parentContext: RouterContext, location: Location): RouterState {
    const routerTypeData = extractStack(location, parentContext.routeKeys);
    const order = routerTypeData[this.routeKey];

    return {
      visible: order != null,
      order,
      at: routerTypeData,
    };
  },
};
