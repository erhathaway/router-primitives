import { extractFeature } from './utils/extractLocation';

import type {
  RouterContext,
  Location,
  RouterState,
} from '../types';

/**
 * Mixins that give the base router FeatureRouting functionality
 * Notably, a feature router needs specific #showFeature, #hideFeature, and #updateFeature methods
*/
export default {
  showFeature(location: Location): Location {
    const search = { [this.routeKey]: true };
    const { options } = this.constructor.updateSetLocationOptions(location, { mutateExistingLocation: this.mutateLocationOnFeatureUpdate });

    return { pathname: location.pathname, search, options };
  },

  hideFeature(location: Location): Location {
    const search = { [this.routeKey]: undefined };
    const { options } = this.constructor.updateSetLocationOptions(location, { mutateExistingLocation: this.mutateLocationOnFeatureUpdate });

    return { pathname: location.pathname, search, options };
  },

  updateFeature(parentState: RouterState, parentContext: RouterContext, location: Location): RouterState {
    const routerTypeData = extractFeature(location, parentContext.routeKeys);
    const visible = routerTypeData[this.routeKey];

    return {
      visible,
      order: undefined,
      at: routerTypeData,
    };
  },
};
