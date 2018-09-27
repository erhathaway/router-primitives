let existingLocation;

const registerRouter = (router) => {
  router.visible = true;

  window.setInterval(() => {
    if (existingLocation !== window.location.href) {
      existingLocation = window.location.href;
      const { pathname, search } = window.location;
      router._update({ pathname, search });
    }
  }, 100);
};

export default registerRouter;
