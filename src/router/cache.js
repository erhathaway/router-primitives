class Cache {
  constructor() {
    this._cacheStore = undefined;
  }

  get hasCache() {
    return !!this._cacheStore;
  }

  get cache() {
    return this._cacheStore;
  }

  removeCache() {
    this._cacheStore = undefined;
  }

  setCacheFromLocation(location) {
    let cache;
    if (this.isPathRouter) {
      cache = location.pathname[this.pathLocation];
    } else {
      cache = location.search[this.routeKey];
    }

    if (!!cache) {
      this._cacheStore = undefined;
    }
  }
}

export default Cache;