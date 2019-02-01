import { extractScene } from './utils/extractLocation';

import type {
  RouterContext,
  Location,
  RouterState,
} from '../types';

/**
 * Mixins that give the base router SceneRouting functionality
 * Notably, a scene router needs specific #showScene, #hideScene, and #updateScene methods
*/
export default {
  showScene(location: Location): Location {
    const { options } = this.constructor.updateSetLocationOptions(location, { mutateExistingLocation: this.mutateLocationOnSceneUpdate });
    let search = {};

    // if router has a parent, get sibling router types and set visiblity to false
    // also used to clear existing search state related to router type which is useful for debuging
    if (this.parent) {
      this.parent.routers[this.type].forEach((r) => {
        if (r.routeKey !== this.routeKey) {
          const updatedLocation = r.hide();
          search = { ...search, ...updatedLocation.search };
        } else {
          search[r.routeKey] = undefined;
        }
      });
    }

    // if router is a pathrouter update the pathname
    if (this.isPathRouter) {
      // dont update pathname if parent isn't visible
      if (this.parent && !this.parent.visible) return location;

      const { pathname } = location;
      pathname[this.routerLevel] = this.routeKey;
      const newPathname = pathname.slice(0, this.routerLevel + 1);

      return { pathname: newPathname, search, options };
    }

    search[this.routeKey] = true;

    return { pathname: location.pathname, search, options };
  },

  hideScene(location: Location): Location {
    const { options } = this.constructor.updateSetLocationOptions(location, { mutateExistingLocation: this.mutateLocationOnSceneUpdate });
    const search = {};

    // if router has a parent, get sibling router types and set visiblity to false
    // also used to clear existing search state related to router type which is useful for debuging
    if (this.parent) {
      this.parent.routers[this.type].forEach((r) => { search[r.routeKey] = undefined; });
    }

    if (this.isPathRouter) {
      const { pathname } = location;
      const newPathname = pathname.slice(0, this.routerLevel);

      return { pathname: newPathname, search, options };
    }
    return { pathname: location.pathname, search, options };
  },

  updateScene(parentState: RouterState, parentContext: RouterContext, location: Location): RouterState {
    const routerTypeData = extractScene(location, parentContext.routeKeys, this.isPathRouter, this.routerLevel);
    const visible = routerTypeData[this.routeKey];

    return {
      visible,
      order: undefined,
      at: routerTypeData,
    };
  },
};
