import { extractData } from './utils/extractLocation';

import type {
  RouterContext,
  Location,
  RouterState,
} from '../types';

/**
 * Mixins that give the base router DataRouting functionality
 * Notably, a data router needs specific #showData, #hideData, #setData, and #updateData methods
*/
export default {
  showData(location: Location): Location {
    if (!this.parent) return location;

    const { options } = this.constructor.updateSetLocationOptions(location, { mutateExistingLocation: this.mutateLocationOnDataUpdate });

    if (this.isPathRouter) {
      const search = {};
      // dont update pathname if it has a parent and parent isn't visible
      if (this.parent && !this.parent.visible) return { pathname: location.pathname, search, options: location.options };

      const { pathname } = location;
      pathname[this.routerLevel] = this.state.data;
      return { pathname, search, options };
    }

    const search = { [this.routeKey]: this.state ? this.state.data : undefined };

    return { pathname: location.pathname, search, options };
  },

  hideData(location: Location): Location {
    const search = { [this.routeKey]: undefined };
    const { options } = this.constructor.updateSetLocationOptions(location, { mutateExistingLocation: this.mutateLocationOnDataUpdate });

    if (this.isPathRouter) {
      const { pathname } = location;
      const newPathname = pathname.slice(0, this.routerLevel);
      return { pathname: newPathname, search, options };
    }

    return { pathname: location.pathname, search, options };
  },

  setData(data: string) {
    this.state.data = data;
    this.show();
  },

  updateData(parentState: RouterState, parentContext: RouterContext, location: Location): RouterState {
    const routerTypeData = extractData(location, parentContext.routeKeys, this.isPathRouter, this.routerLevel, this);
    const visible = Object.values(routerTypeData).filter(i => i != null).length > 0;

    // only set data if there is data to set
    const data = routerTypeData[this.routeKey]
      ? { data: routerTypeData[this.routeKey] }
      : {};
    return {
      visible,
      order: undefined,
      at: routerTypeData,
      ...data,
    };
  },
};
