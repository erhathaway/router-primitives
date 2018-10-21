// @flow

import Router from './index';

let existingLocation: string;

const registerRouter = (router: Router) => {
  router.state = { visible: true };

  window.setInterval(() => {
    const newLocation = (window.location.href: string);
    if (existingLocation !== newLocation) {
      existingLocation = newLocation;
      router._update(Router.routerLocation());
    }
  }, 100);
};

export default registerRouter;
