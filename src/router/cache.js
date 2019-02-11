class Cache {
  constructor() {
    this._cacheStore = undefined;
  }

  get hasCache() {
    return !!this._cacheStore;
  }

  get state() {
    return this._cacheStore;
  }

  removeCache() {
    this._cacheStore = undefined;
  }

  setCache(value) {
    this._cacheStore = value;
  }

  setCacheFromLocation(location, routerInstance) {
    // dont set cache if one already exists!
    if (this.hasCache) { return; }

    let cache;
    if (routerInstance.isPathRouter) {
      cache = location.pathname[routerInstance.pathLocation];
    } else {
      cache = !!location.search[routerInstance.routeKey];
    }

    this.setCache(cache);
  }
}

export default Cache;
