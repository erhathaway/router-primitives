import Router from './index';

let existingLocation;

const registerRouter = (router) => {
  router.setState({ visible: true });

  window.setInterval(() => {
    if (existingLocation !== window.location.href) {
      existingLocation = window.location.href;
      router._update(Router.routerLocation());
    }
  }, 100);
};

export default registerRouter;
