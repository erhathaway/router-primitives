import {
  types,
  getRoot,
  clone,
} from 'mobx-state-tree';

import queryString from 'query-string';

import {
  dynamicallyGenerateNavToPathMethods,
  dynamicallyGenerateToggleModalMethods,
  dynamicallyGenerateToggleVisibleFeaturesMethods,
  dynamicallyGeneratePageNavMethods,
  extractScene,
  extractFeatures,
  extractModal,
  extractPage,
} from './utils';


const RouterBase = types
  .model('RouterBase', {
    // config
    name: types.string,
    routeKey: types.string, // the id in the querystring or the id matching the page id
    // state
    isAtScene: types.maybe(types.string),
    isFromScene: types.maybe(types.string),
    visibleStack: types.maybe(types.array(types.string)),
    visibleFeatures: types.maybe(types.array(types.string)),
    // models
    stack: types.maybe(types.array(types.late(() => RouterBase))), // 'modal' querystring
    scenes: types.maybe(types.array(types.late(() => RouterBase))), // 'pathname' modification
    features: types.maybe(types.array(types.late(() => RouterBase))), // 'show' querystring
    pages: types.maybe(types.array(types.late(() => RouterBase))), // instances to use for the current page
    // pages model - not directly create, but indirectly through the `setPages` method
    _pages: types.maybe(types.array(types.frozen())), //{ routeKey, name, pageInstanceName },
    currentPage: types.maybe(types.late(() => RouterBase)),
  })
  .actions(self => ({
    _setRouteKey(key) {
      self.routeKey = key;
    },
    /* ------------------------ */
    /* NAV */
    /* ------------------------ */
    ...dynamicallyGenerateNavToPathMethods(self),
    ...dynamicallyGenerateToggleModalMethods(self),
    ...dynamicallyGenerateToggleVisibleFeaturesMethods(self),
    ...dynamicallyGeneratePageNavMethods(self),
    afterCreate() {
      console.log('hello!')
      // addd getter methods to access the routers from the parent
      const root = getRoot(self);
      const children = [].concat(self.stack).concat(self.features).concat(self.scenes)
        .filter(c => c && true);

      children.forEach(child => {
        Object.defineProperty(root, `${child.name}Router`, {
          get: function() { return child }
        });
      })
    },
    updateLocation(newLocation) {
      // pass down the new location state to all routers and update their stores accordingly
      if (self.scenes) { self.updateScene(extractScene(newLocation, self.routeKey)); }
      if (self.stack) { self.updateStack(extractModal(newLocation, self.routeKey)); }
      if (self.features) { self.updateVisibleFeatures(extractFeatures(newLocation, self.routeKey)); }
      if (self.pages) { self.updatePage(extractPage(newLocation, self.routeKey)); }

      if (self.scenes) self.scenes.forEach(s => s.updateLocation(newLocation));
      if (self.stack) self.stack.forEach(m => m.updateLocation(newLocation));
      if (self.features) self.features.forEach(f => f.updateLocation(newLocation));
      if (self.currentPage) self.currentPage.updateLocation(newLocation);
    },
    /* ------------------------ */
    /* HISTORY */
    /* ------------------------ */
    updateScene(newScene) {
      if (newScene) {
        self.isFromScene = self.isAtScene;
        self.isAtScene = newScene;
      }
    },
    updateStack(visibleStack) {
      self.visibleStack = visibleStack;
    },
    updateVisibleFeatures(features) {
      self.visibleFeatures = features;
    },
    /* ------------------------ */
    /* HISTORY UTILS*/
    /* ------------------------ */
    setAt(newAtName) {
      self.isFromPath = self.isAtPath;
      self.isAtPath = newAtName;
    },
    getModal(location) {
      const parsedQuery = queryString.parse(location.search, { decode: true });
      return parsedQuery.modal;
    },
    getPath(location) {
      // remove forward slashes
      return location.pathname.replace(/\//g, '')
    },

    /* ------------------------ */
    /* PAGES*/
    /* ------------------------ */
    navToNextPage(history) {
      const { routeKey } = self.nextPage;
      if (routeKey) self.navToPage(history, routeKey);
    },
    navToPreviousPage(history) {
      const { routeKey } = self.previousPage;
      if (routeKey) self.navToPage(history, routeKey);
    },
    updatePage(pageId) {
      if (!pageId) return;
      // for all pages registered via the 'setPages' method, find the one that matches the page id
      const foundPageInfo = self._pages ? self._pages.find(p => p.routeKey === pageId.toString()) : undefined;
      if (foundPageInfo) {
        // for all mobx page model instances, find the instance name that matches the one for the desired page
        const foundPageInstance = self.pages.find(p => p.name === foundPageInfo.pageInstanceName);
        if (foundPageInstance) {
          const newInstance = clone(foundPageInstance)
          self.currentPage = newInstance;
          self.currentPage._setRouteKey(foundPageInfo.routeKey);
        }
      };
    },
    setPages(pages) {
      self._pages = pages.map(({ id, name, pageInstanceName }) => ({ routeKey: id, name, pageInstanceName }));
    },
  }))
  .views(self => ({
    get topOfStack() {
      if (!self.visibleStack) return undefined;

      return self.visibleStack.map(n => n).slice(-1);
    },
    isFeatureVisible(name) {
      return self.visibleFeatures && self.visibleFeatures.map(n => n).includes(name);
    },
    isTopOfStack(name) {
      return self.topOfStack === name;
    },
    get nextPage() {
      if (self.currentPage) {
        const currentPageIndex = self._pages.findIndex(p => p.routeKey === self.currentPage.routeKey);
        const nextPage = self._pages[currentPageIndex + 1];
        return nextPage || {};
      }
    },
    get previousPage() {
      if (self.currentPage) {
        const currentPageIndex = self._pages.findIndex(p => p.routeKey === self.currentPage.routeKey);
        const nextPage = self._pages[currentPageIndex - 1];
        return nextPage || {};
      }
    },
  }));

// export default RouterBase;
