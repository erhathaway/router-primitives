let existingLocation;

const registerRouter = (router) => {
  router.visible = true;
  console.log('registering router')

  window.setInterval(() => {
    if (existingLocation !== window.location.href) {
      existingLocation = window.location.href;
      const { pathname, search } = window.location;
      router._update({ pathname, search });
    }
  }, 100);
};

export default registerRouter;
