var strictUriEncode = function strictUriEncode(str) {
	return encodeURIComponent(str).replace(/[!'()*]/g, function (c) {
		return '%' + c.charCodeAt(0).toString(16).toUpperCase();
	});
};

/*
object-assign
(c) Sindre Sorhus
@license MIT
*/
/* eslint-disable no-unused-vars */

var getOwnPropertySymbols = Object.getOwnPropertySymbols;
var hasOwnProperty = Object.prototype.hasOwnProperty;
var propIsEnumerable = Object.prototype.propertyIsEnumerable;

function toObject(val) {
	if (val === null || val === undefined) {
		throw new TypeError('Object.assign cannot be called with null or undefined');
	}

	return Object(val);
}

function shouldUseNative() {
	try {
		if (!Object.assign) {
			return false;
		}

		// Detect buggy property enumeration order in older V8 versions.

		// https://bugs.chromium.org/p/v8/issues/detail?id=4118
		var test1 = new String('abc'); // eslint-disable-line no-new-wrappers
		test1[5] = 'de';
		if (Object.getOwnPropertyNames(test1)[0] === '5') {
			return false;
		}

		// https://bugs.chromium.org/p/v8/issues/detail?id=3056
		var test2 = {};
		for (var i = 0; i < 10; i++) {
			test2['_' + String.fromCharCode(i)] = i;
		}
		var order2 = Object.getOwnPropertyNames(test2).map(function (n) {
			return test2[n];
		});
		if (order2.join('') !== '0123456789') {
			return false;
		}

		// https://bugs.chromium.org/p/v8/issues/detail?id=3056
		var test3 = {};
		'abcdefghijklmnopqrst'.split('').forEach(function (letter) {
			test3[letter] = letter;
		});
		if (Object.keys(Object.assign({}, test3)).join('') !== 'abcdefghijklmnopqrst') {
			return false;
		}

		return true;
	} catch (err) {
		// We don't expect any of the above to throw, but better to be safe.
		return false;
	}
}

var objectAssign = shouldUseNative() ? Object.assign : function (target, source) {
	var from;
	var to = toObject(target);
	var symbols;

	for (var s = 1; s < arguments.length; s++) {
		from = Object(arguments[s]);

		for (var key in from) {
			if (hasOwnProperty.call(from, key)) {
				to[key] = from[key];
			}
		}

		if (getOwnPropertySymbols) {
			symbols = getOwnPropertySymbols(from);
			for (var i = 0; i < symbols.length; i++) {
				if (propIsEnumerable.call(from, symbols[i])) {
					to[symbols[i]] = from[symbols[i]];
				}
			}
		}
	}

	return to;
};

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
  return typeof obj;
} : function (obj) {
  return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
};

var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();

var _extends = Object.assign || function (target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i];

    for (var key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key];
      }
    }
  }

  return target;
};

var inherits = function (subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
  }

  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
  if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
};

var possibleConstructorReturn = function (self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return call && (typeof call === "object" || typeof call === "function") ? call : self;
};

var token = '%[a-f0-9]{2}';
var singleMatcher = new RegExp(token, 'gi');
var multiMatcher = new RegExp('(' + token + ')+', 'gi');

function decodeComponents(components, split) {
	try {
		// Try to decode the entire string first
		return decodeURIComponent(components.join(''));
	} catch (err) {
		// Do nothing
	}

	if (components.length === 1) {
		return components;
	}

	split = split || 1;

	// Split the array in 2 parts
	var left = components.slice(0, split);
	var right = components.slice(split);

	return Array.prototype.concat.call([], decodeComponents(left), decodeComponents(right));
}

function decode(input) {
	try {
		return decodeURIComponent(input);
	} catch (err) {
		var tokens = input.match(singleMatcher);

		for (var i = 1; i < tokens.length; i++) {
			input = decodeComponents(tokens, i).join('');

			tokens = input.match(singleMatcher);
		}

		return input;
	}
}

function customDecodeURIComponent(input) {
	// Keep track of all the replacements and prefill the map with the `BOM`
	var replaceMap = {
		'%FE%FF': '\uFFFD\uFFFD',
		'%FF%FE': '\uFFFD\uFFFD'
	};

	var match = multiMatcher.exec(input);
	while (match) {
		try {
			// Decode as big chunks as possible
			replaceMap[match[0]] = decodeURIComponent(match[0]);
		} catch (err) {
			var result = decode(match[0]);

			if (result !== match[0]) {
				replaceMap[match[0]] = result;
			}
		}

		match = multiMatcher.exec(input);
	}

	// Add `%C2` at the end of the map to make sure it does not replace the combinator before everything else
	replaceMap['%C2'] = '\uFFFD';

	var entries = Object.keys(replaceMap);

	for (var i = 0; i < entries.length; i++) {
		// Replace all decoded components
		var key = entries[i];
		input = input.replace(new RegExp(key, 'g'), replaceMap[key]);
	}

	return input;
}

var decodeUriComponent = function decodeUriComponent(encodedURI) {
	if (typeof encodedURI !== 'string') {
		throw new TypeError('Expected `encodedURI` to be of type `string`, got `' + (typeof encodedURI === 'undefined' ? 'undefined' : _typeof(encodedURI)) + '`');
	}

	try {
		encodedURI = encodedURI.replace(/\+/g, ' ');

		// Try the built in decoder first
		return decodeURIComponent(encodedURI);
	} catch (err) {
		// Fallback to a more advanced decoder
		return customDecodeURIComponent(encodedURI);
	}
};

function encoderForArrayFormat(opts) {
	switch (opts.arrayFormat) {
		case 'index':
			return function (key, value, index) {
				return value === null ? [encode(key, opts), '[', index, ']'].join('') : [encode(key, opts), '[', encode(index, opts), ']=', encode(value, opts)].join('');
			};

		case 'bracket':
			return function (key, value) {
				return value === null ? encode(key, opts) : [encode(key, opts), '[]=', encode(value, opts)].join('');
			};

		default:
			return function (key, value) {
				return value === null ? encode(key, opts) : [encode(key, opts), '=', encode(value, opts)].join('');
			};
	}
}

function parserForArrayFormat(opts) {
	var result;

	switch (opts.arrayFormat) {
		case 'index':
			return function (key, value, accumulator) {
				result = /\[(\d*)\]$/.exec(key);

				key = key.replace(/\[\d*\]$/, '');

				if (!result) {
					accumulator[key] = value;
					return;
				}

				if (accumulator[key] === undefined) {
					accumulator[key] = {};
				}

				accumulator[key][result[1]] = value;
			};

		case 'bracket':
			return function (key, value, accumulator) {
				result = /(\[\])$/.exec(key);
				key = key.replace(/\[\]$/, '');

				if (!result) {
					accumulator[key] = value;
					return;
				} else if (accumulator[key] === undefined) {
					accumulator[key] = [value];
					return;
				}

				accumulator[key] = [].concat(accumulator[key], value);
			};

		default:
			return function (key, value, accumulator) {
				if (accumulator[key] === undefined) {
					accumulator[key] = value;
					return;
				}

				accumulator[key] = [].concat(accumulator[key], value);
			};
	}
}

function encode(value, opts) {
	if (opts.encode) {
		return opts.strict ? strictUriEncode(value) : encodeURIComponent(value);
	}

	return value;
}

function keysSorter(input) {
	if (Array.isArray(input)) {
		return input.sort();
	} else if ((typeof input === 'undefined' ? 'undefined' : _typeof(input)) === 'object') {
		return keysSorter(Object.keys(input)).sort(function (a, b) {
			return Number(a) - Number(b);
		}).map(function (key) {
			return input[key];
		});
	}

	return input;
}

function extract(str) {
	var queryStart = str.indexOf('?');
	if (queryStart === -1) {
		return '';
	}
	return str.slice(queryStart + 1);
}

function parse(str, opts) {
	opts = objectAssign({ arrayFormat: 'none' }, opts);

	var formatter = parserForArrayFormat(opts);

	// Create an object with no prototype
	// https://github.com/sindresorhus/query-string/issues/47
	var ret = Object.create(null);

	if (typeof str !== 'string') {
		return ret;
	}

	str = str.trim().replace(/^[?#&]/, '');

	if (!str) {
		return ret;
	}

	str.split('&').forEach(function (param) {
		var parts = param.replace(/\+/g, ' ').split('=');
		// Firefox (pre 40) decodes `%3D` to `=`
		// https://github.com/sindresorhus/query-string/pull/37
		var key = parts.shift();
		var val = parts.length > 0 ? parts.join('=') : undefined;

		// missing `=` should be `null`:
		// http://w3.org/TR/2012/WD-url-20120524/#collect-url-parameters
		val = val === undefined ? null : decodeUriComponent(val);

		formatter(decodeUriComponent(key), val, ret);
	});

	return Object.keys(ret).sort().reduce(function (result, key) {
		var val = ret[key];
		if (Boolean(val) && (typeof val === 'undefined' ? 'undefined' : _typeof(val)) === 'object' && !Array.isArray(val)) {
			// Sort object keys, not values
			result[key] = keysSorter(val);
		} else {
			result[key] = val;
		}

		return result;
	}, Object.create(null));
}

var extract_1 = extract;
var parse_1 = parse;

var stringify = function stringify(obj, opts) {
	var defaults$$1 = {
		encode: true,
		strict: true,
		arrayFormat: 'none'
	};

	opts = objectAssign(defaults$$1, opts);

	if (opts.sort === false) {
		opts.sort = function () {};
	}

	var formatter = encoderForArrayFormat(opts);

	return obj ? Object.keys(obj).sort(opts.sort).map(function (key) {
		var val = obj[key];

		if (val === undefined) {
			return '';
		}

		if (val === null) {
			return encode(key, opts);
		}

		if (Array.isArray(val)) {
			var result = [];

			val.slice().forEach(function (val2) {
				if (val2 === undefined) {
					return;
				}

				result.push(formatter(key, val2, result.length));
			});

			return result.join('&');
		}

		return encode(key, opts) + '=' + encode(val, opts);
	}).filter(function (x) {
		return x.length > 0;
	}).join('&') : '';
};

var parseUrl = function parseUrl(str, opts) {
	return {
		url: str.split('?')[0] || '',
		query: parse(extract(str), opts)
	};
};

var queryString = {
	extract: extract_1,
	parse: parse_1,
	stringify: stringify,
	parseUrl: parseUrl
};

var deserializer = function deserializer() {
  var serializedLocation = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';

  // return { pathname: [], search: {}, options: {} };
  var locationStringParts = serializedLocation.split('?');

  var search = queryString.parse(locationStringParts[1], { decode: true, arrayFormat: 'bracket' });
  var pathname = locationStringParts[0].split('/').filter(function (s) {
    return s !== '';
  });

  return { search: search, pathname: pathname, options: {} };
};

// const joinLocationParts = ({ pathname, search }) => {
//   if (window && window.history) {
//     const url = `${pathname}?${search}`;
//     if (options.mutateExistingLocation) {
//       window.history.replaceState({ url }, '', url);
//     } else {
//       window.history.pushState({ url }, '', url);
//     }
//   }

var serializer = function serializer(newLocation) {
  var oldLocation = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  var newPathname = newLocation.pathname || [];
  var newSearchObj = newLocation.search || {};

  // const { search: oldSearchObj } = oldLocation;
  var oldSearchObj = oldLocation.search || {};
  var combinedSearchObj = _extends({}, oldSearchObj, newSearchObj);
  // const combinedSearchObj = { ...newSearchObj };

  Object.keys(combinedSearchObj).forEach(function (key) {
    return combinedSearchObj[key] == null && delete combinedSearchObj[key];
  });

  var searchString = queryString.stringify(combinedSearchObj, { arrayFormat: 'bracket' });
  var pathname = newPathname.join('/');
  var pathnameString = pathname === '' ? '/' : pathname;

  var location = void 0;
  if (searchString === '') {
    location = pathnameString;
  } else {
    location = pathnameString + '?' + searchString;
  }

  return { location: location, options: newLocation.options };
};

/**
 * The store that the router manager uses to write and read from the serialized state
 * The serialized state store is what, on the web, holds the URL - aka the serilaized state of the router tree
 * For non web, or when manager.config.serializedStateStore === 'native' this store is used
 * The default serialized state is a string for this store
 */

var NativeStore = function () {
  function NativeStore() {
    classCallCheck(this, NativeStore);

    // this.state = state;
    this.observers = [];
    this.config = { serializer: serializer, deserializer: deserializer, historySize: 10 };
    this.history = [];
    this.currentLocationInHistory = 0;
  }

  // unserialized state = { pathname: [], search: {}, options: {} }
  // options = { updateHistory }


  createClass(NativeStore, [{
    key: 'setState',
    value: function setState(unserializedLocation) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      var oldUnserializedLocation = this.getState();

      var _config$serializer = this.config.serializer(unserializedLocation, oldUnserializedLocation),
          newState = _config$serializer.location;
      // this.state = newState;

      if (options.updateHistory !== false) {
        // clone history
        var newHistory = this.history.slice();

        // not mutating the location causes the previous location to be replaced
        // thus, there will be no history of it
        // this is useful when you use modals and other elements that dont have a concept of 'back'
        // b/c once you close a modal it shouldn't reappear if you click 'back'
        if (unserializedLocation.options && unserializedLocation.options.replaceLocation === true) {
          // remove previous location
          newHistory.shift();
        }

        // add current to history
        newHistory.unshift(newState.slice());
        // enforce history size
        if (newHistory.length > this.config.historySize) {
          newHistory = newHistory.slice(0, this.config.historySize);
        }
        // set history
        this.history = newHistory;
      }

      this.notifyObservers();
    }
  }, {
    key: 'getState',
    value: function getState() {
      return this.config.deserializer(this.history[this.currentLocationInHistory]);
    }
  }, {
    key: 'subscribeToStateChanges',
    value: function subscribeToStateChanges(fn) {
      this.observers.push(fn);
    }

    // unsubscribeToStateChanges // TODO fill me in!

  }, {
    key: 'notifyObservers',
    value: function notifyObservers() {
      var deserializedState = this.getState();
      this.observers.forEach(function (fn) {
        return fn(deserializedState);
      });
    }
  }, {
    key: 'back',
    value: function back() {
      this.go(-1);
    }
  }, {
    key: 'forward',
    value: function forward() {
      this.go(1);
    }
  }, {
    key: 'go',
    value: function go(historyChange) {
      if (historyChange === 0) {
        throw new Error('No history size change specified');
      }

      // calcuate request history location
      var newLocation = this.currentLocationInHistory - historyChange;

      // if within the range of recorded history, set as the new history location
      if (newLocation + 1 <= this.history.length && newLocation >= 0) {
        this.currentLocationInHistory = newLocation;

        // if too far in the future, set as the most recent history
      } else if (newLocation + 1 <= this.history.length) {
        this.currentLocationInHistory = 0;

        // if too far in the past, set as the last recorded history
      } else if (newLocation >= 0) {
        this.currentLocationInHistory = this.history.length - 1;
      }

      this.setState(this.getState(), { updateHistory: false });
    }
  }]);
  return NativeStore;
}();

/**
 * The store that the router manager uses to write and read from the serialized state
 * The serialized state store is what, on the web, holds the URL - aka the serilaized state of the router tree
 * The default serialized state is the URL for this store
 */

var BrowserStore = function () {
  function BrowserStore() {
    var _this = this;
    classCallCheck(this, BrowserStore);

    this.observers = [];
    this.config = { serializer: serializer, deserializer: deserializer };

    // subscribe to location changes
    this.existingLocation = '';
    this.stateWatcher = window.setInterval(function () {
      _this._monitorLocation();
    }, 100);
  }

  createClass(BrowserStore, [{
    key: '_monitorLocation',
    value: function _monitorLocation() {
      var newLocation = window.location.href;
      if (this.existingLocation !== newLocation) {
        this.existingLocation = newLocation;
        this.notifyObservers();
      }
    }

    // unserialized state = { pathname: [], search: {}, options: {} }
    // options = { updateHistory }

  }, {
    key: 'setState',
    value: function setState(unserializedLocation) {
      var oldUnserializedLocation = this.getState();

      var _config$serializer = this.config.serializer(unserializedLocation, oldUnserializedLocation),
          newState = _config$serializer.location;

      if (unserializedLocation.options && unserializedLocation.options.replaceLocation === true) {
        window.history.replaceState({ url: newState }, '', newState);
      } else {
        window.history.pushState({ url: newState }, '', newState);
      }

      this.notifyObservers();
    }
  }, {
    key: 'notifyObservers',
    value: function notifyObservers() {
      var deserializedState = this.getState();
      this.observers.forEach(function (fn) {
        return fn(deserializedState);
      });
    }
  }, {
    key: 'getState',
    value: function getState() {
      var searchString = window.location.search || '';
      var pathnameString = window.location.pathname || '';
      return this.config.deserializer(pathnameString + searchString);
    }
  }, {
    key: 'subscribeToStateChanges',
    value: function subscribeToStateChanges(fn) {
      this.observers.push(fn);
    }
  }, {
    key: 'back',
    value: function back() {
      window.history.back();
    }
  }, {
    key: 'forward',
    value: function forward() {
      window.history.forward();
    }
  }, {
    key: 'go',
    value: function go(historyChange) {
      window.history.go(historyChange);
    }
  }]);
  return BrowserStore;
}();

// export const defaultStore = {};

var DefaultRoutersStateAdapter = function () {
  function DefaultRoutersStateAdapter(store) {
    var config = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : { historySize: 2 };
    classCallCheck(this, DefaultRoutersStateAdapter);

    this.store = store || {};
    this.config = config;
    this.observers = {}; // key is routerName
  }

  createClass(DefaultRoutersStateAdapter, [{
    key: "setState",
    value: function setState(desiredRouterStates) {
      var _this = this;

      var routerNames = Object.keys(desiredRouterStates);
      var hasUpdatedTracker = [];

      this.store = routerNames.reduce(function (routerStates, routerName) {
        // extract current and historical states
        var _ref = routerStates[routerName] || { current: {}, historical: [] },
            prevCurrent = _ref.current,
            historical = _ref.historical;

        var newCurrent = desiredRouterStates[routerName];

        // // remove null and undefined keys
        // Object.keys(newCurrent).forEach((key) => (newCurrent[key] == null) && delete newCurrent[key]);

        // skip routers who haven't been updated
        if (JSON.stringify(newCurrent) === JSON.stringify(prevCurrent)) {
          return routerStates;
        }

        // clone historical states
        var newHistorical = historical.slice();

        // check to make sure there is state to record into history
        if (Object.keys(prevCurrent).length > 0) {
          // add current to historical states
          newHistorical.unshift(prevCurrent);
        }
        // enforce history size
        if (newHistorical.length > _this.config.historySize) {
          newHistorical = newHistorical.slice(0, _this.config.historySize);
        }
        // update state to include new router state
        routerStates[routerName] = { current: newCurrent, historical: newHistorical

          // record which routers have had a state change
        };hasUpdatedTracker.push(routerName);

        return routerStates;
      }, Object.assign(this.getState()));

      // call observers of all routers that have had state changes
      hasUpdatedTracker.forEach(function (routerName) {
        var observers = _this.observers[routerName] || [];
        if (Array.isArray(observers)) {
          observers.forEach(function (fn) {
            return fn(_this.store[routerName]);
          });
        }
      });
    }
  }, {
    key: "createRouterStateGetter",
    value: function createRouterStateGetter(routerName) {
      var _this2 = this;

      return function () {
        return _this2.store[routerName] || {};
      };
    }
  }, {
    key: "createRouterStateSubscriber",
    value: function createRouterStateSubscriber(routerName) {
      var _this3 = this;

      return function (fn) {
        if (Array.isArray(_this3.observers[routerName])) {
          _this3.observers[routerName].push(fn);
        } else {
          _this3.observers[routerName] = [fn];
        }
      };
    }
  }, {
    key: "getState",
    value: function getState() {
      return this.store;
    }
  }]);
  return DefaultRoutersStateAdapter;
}();

var Cache = function () {
  function Cache() {
    classCallCheck(this, Cache);

    this._cacheStore = undefined;
  }

  createClass(Cache, [{
    key: "removeCache",
    value: function removeCache() {
      this._cacheStore = undefined;
    }
  }, {
    key: "setCache",
    value: function setCache(value) {
      this._cacheStore = value;
    }
  }, {
    key: "setCacheFromLocation",
    value: function setCacheFromLocation(location, routerInstance) {
      // dont set cache if one already exists!
      if (this.hasCache) {
        return;
      }

      var cache = void 0;
      if (routerInstance.isPathRouter) {
        cache = location.pathname[routerInstance.pathLocation];
      } else {
        cache = location.search[routerInstance.routeKey];
      }

      this.setCache(cache);
    }
  }, {
    key: "hasCache",
    get: function get$$1() {
      return !!this._cacheStore;
    }
  }, {
    key: "state",
    get: function get$$1() {
      return this._cacheStore;
    }
  }]);
  return Cache;
}();

var RouterBase = function () {
  function RouterBase() {
    var init = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    classCallCheck(this, RouterBase);
    var name = init.name,
        config = init.config,
        type = init.type,
        manager = init.manager,
        parent = init.parent,
        routers = init.routers,
        root = init.root,
        defaultShow = init.defaultShow,
        disableCaching = init.disableCaching,
        getState = init.getState,
        subscribe = init.subscribe;


    if (!name || !type || !manager) {
      throw new Error('Missing required kwargs: name, type, and/or manager');
    }
    // required
    this.name = name;
    this.config = config || {};
    this.type = type;
    this.actionNames = []; // used to map over the actions and replace with the actionHandler closure
    this.manager = manager;

    // optional
    this.parent = parent;
    this.routers = routers || {};
    this.root = root;

    // methods customized for instance from manager
    this.getState = getState;
    this.subscribe = subscribe;

    // default actions to call when immediate parent visibility changes from hidden -> visible
    this.defaultShow = defaultShow || false;
    this.disableCaching = disableCaching;

    // store the routers location data for rehydration
    this.cache = new Cache();
  }

  createClass(RouterBase, [{
    key: 'getNeighborsByType',
    value: function getNeighborsByType(type) {
      if (this.parent && this.parent.routers) {
        return this.parent.routers[type] || [];
      }
      return [];
    }
  }, {
    key: '_addChildRouter',


    // TODO Remove testing dependency - this shouldn't be used since it bypasses the manager
    // Create utility function instead to orchestrate relationships between routers
    value: function _addChildRouter(router) {
      if (!router.type) {
        throw new Error('Router is missing type');
      }

      var siblingTypes = this.routers[router.type] || [];
      siblingTypes.push(router);
      this.routers[router.type] = siblingTypes;

      router.parent = this;
    }
  }, {
    key: 'calcCachedLocation',


    // TODO deprecate this method and remove tests
    // return pathLocation cached data types
    value: function calcCachedLocation() {
      var globalState = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

      // reuse global state for efficiency if doing a recursive calculation
      var routerState = globalState ? globalState[this.name].current : this.state;

      if (this.isPathRouter) {
        if (this.type === 'data') {
          return { isPathData: true, pathLocation: this.pathLocation, value: routerState.data };
        }
        return { isPathData: true, pathLocation: this.pathLocation, value: routerState.visible };
      }

      // return queryParam cached data types
      if (this.type === 'data') {
        return { queryParam: this.routeKey, value: routerState.data };
      }
      if (this.type === 'stack') {
        return { queryParam: this.routeKey, value: routerState.order };
      }
      return { queryParam: this.routeKey, value: routerState.visible };
    }

    // TODO deprecate this function and remove tests

  }, {
    key: 'routeKey',
    get: function get$$1() {
      return this.config.routeKey || this.name;
    }
  }, {
    key: 'shouldStoreLocationMutationInHistory',
    get: function get$$1() {
      return this.config.shouldStoreLocationMutationInHistory;
    }
  }, {
    key: 'siblings',
    get: function get$$1() {
      var _this = this;

      return this.parent.routers[this.type].filter(function (r) {
        return r.name !== _this.name;
      });
    }
  }, {
    key: 'pathLocation',
    get: function get$$1() {
      if (!this.parent) return -1;
      return 1 + this.parent.pathLocation;
    }
  }, {
    key: 'isRootRouter',
    get: function get$$1() {
      return !this.parent;
    }
  }, {
    key: 'isPathRouter',
    get: function get$$1() {
      // if there is no parent, we are at the root. The root is by default a path router since
      // it represents the '/' in a pathname location
      if (!this.parent) return true;
      // if this router was explicitly set to be a path router during config, return true
      if (this.config.isPathRouter && this.parent.isPathRouter) {
        return true;
      }
      // else if this router is a path router but its parent isn't we need to throw an error.
      // it is impossible to construct a path if all the parents are also not path routers
      if (this.config.isPathRouter) {
        throw new Error(this.type + ' router: ' + this.name + ' is explicitly set to modify the pathname\n        but one of its parent routers doesnt have this permission.\n        Make sure all parents have \'isPathRouter\' attribute set to \'true\' in the router config OR\n        Make sure all parents are of router type \'scene\' or \'data\'.\n        If the routers parents have siblings of both \'scene\' and \'data\' the \'scene\' router will always be used for the pathname\n      ');
      }

      if (this.type === 'scene' && this.parent.isPathRouter) {
        // check to make sure neighboring data routers arent explicitly set to modify the pathname
        var neighboringDataRouters = this.getNeighborsByType('data'); // this.parent.routers.data || [];
        var isSiblingRouterExplictlyAPathRouter = neighboringDataRouters.reduce(function (acc, r) {
          return (
            // check all data router neighbors and
            // make sure none have been explicitly set to be a path router
            acc || r.config.isPathRouter === true
          );
        }, false);
        if (isSiblingRouterExplictlyAPathRouter === false) return true;
      } else if (this.type === 'data' && this.parent && this.parent.isPathRouter) {
        if (this._isPathRouter === false) return false;
        // check to make sure neighboring scene routers aren't present
        var neighboringSceneRouters = this.getNeighborsByType('scene');
        // if (neighboringSceneRouters.length === 0) return true;

        return neighboringSceneRouters.length === 0 && !this.siblings.reduce(function (acc, r) {
          return (
            // check all data router siblings and
            // make sure none are path routers
            acc || r.config.isPathRouter === true
          );
        }, false);
      }

      return false;
    }
  }, {
    key: 'state',
    get: function get$$1() {
      if (!this.getState) {
        throw new Error('no getState function specified by the manager');
      }

      var _getState = this.getState(),
          current = _getState.current;

      return current || {};
    }
  }, {
    key: 'history',
    get: function get$$1() {
      if (!this.getState) {
        throw new Error('no getState function specified by the manager');
      }

      var _getState2 = this.getState(),
          historical = _getState2.historical;

      return historical || [];
    }
  }], [{
    key: 'joinLocationWithCachedLocation',
    value: function joinLocationWithCachedLocation(location, cachedLocation) {
      var newLocation = Object.assign({}, location);
      if (cachedLocation.isPathData) {
        newLocation.path[cachedLocation.pathLocation] = cachedLocation.value;
      } else {
        newLocation.search[cachedLocation.queryParam] = cachedLocation.value;
      }
      return newLocation;
    }
  }]);
  return RouterBase;
}();

var show = function show(location, router) {
  var ctx = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

  // hide sibling routers
  location = router.siblings.reduce(function (acc, s) {
    return s.hide(acc, s, ctx);
  }, location);

  if (router.isPathRouter) {
    var parent = router.parent;


    if (!ctx.addingDefaults && (!parent || !parent.state.visible && !parent.isRootRouter)) {
      return location;
    }

    location.pathname[router.pathLocation] = router.routeKey;
    // drop pathname after this pathLocation
    location.pathname = location.pathname.slice(0, router.pathLocation + 1);
  } else {
    location.search[router.routeKey] = true;
  }

  // add defaults for child routers
  // location = router.constructor.addLocationDefaults(location, router, ctx);

  return location;
};

var hide = function hide(location, router, ctx) {
  if (router.isPathRouter) {
    location.pathname = location.pathname.slice(0, router.pathLocation);
  } else {
    location.search[router.routeKey] = undefined;
  }

  return location;
};

var reducer = function reducer(location, router, ctx) {
  var newState = {};
  if (router.isPathRouter) {
    newState['visible'] = location.pathname[router.pathLocation] === router.routeKey;
  } else {
    newState['visible'] = location.search[router.routeKey] === 'true';
  }

  return newState;
};

// TODO figure out what to do about default states
var defaultState = {
  visible: 'lala'
};

var parser = function parser() {};

var scene = {
  actions: { show: show, hide: hide },
  state: defaultState,
  reducer: reducer,
  parser: parser
};

// returns the routeKey names of visible routers based on the ordering of their 'order' state
function getRouteKeyOrderings(router) {
  // creates an object of { [visible router routeKey]: order }
  var routeKeyOrderObj = router.parent.routers[router.type].reduce(function (acc, r) {
    if (r.state.visible === false) {
      return acc;
    }
    acc[r.routeKey] = r.state.order;
    return acc;
  }, {});

  /*
    { <routeKeyName>: <order> }
  */

  // reduce the order object to the array of sorted keys
  var routerRouteKeys = Object.keys(routeKeyOrderObj);
  /* reorder routeKeyOrderObj by order
    ex: { <order>: <routeKeyName> }
  */
  var orderAsKey = routerRouteKeys.reduce(function (acc, key) {
    var value = routeKeyOrderObj[key];
    if (value != null && !Number.isNaN(value)) {
      acc[routeKeyOrderObj[key]] = key;
    }
    return acc;
  }, {});

  var orders = Object.values(routeKeyOrderObj);
  var filteredOrders = orders.filter(function (n) {
    return n != null && !Number.isNaN(n);
  });
  var sortedOrders = filteredOrders.sort(function (a, b) {
    return a - b;
  });
  var sortedKeys = sortedOrders.map(function (order) {
    return orderAsKey[order];
  });
  return sortedKeys;
}

var show$1 = function show(location, router, ctx) {
  if (!router.parent) {
    return location;
  }

  var sortedKeys = getRouteKeyOrderings(router);

  // find index of this routers routeKey
  var index = sortedKeys.indexOf(router.routeKey);
  if (index > -1) {
    // remove routeKey if it exists
    sortedKeys.splice(index, 1);
  }
  // add route key to front of sorted keys
  sortedKeys.unshift(router.routeKey);

  // create search object
  var search = sortedKeys.reduce(function (acc, key, i) {
    acc[key] = i + 1;
    return acc;
  }, {});

  location.search = _extends({}, location.search, search);
  // const { options } = this.constructor.updateSetLocationOptions(location, { mutateExistingLocation: this.mutateLocationOnStackUpdate });

  // return { pathname: location.pathname, search, options };
  return location;
};

var hide$1 = function hide(location, router, ctx) {
  if (!router.parent) return location;

  var sortedKeys = getRouteKeyOrderings(router);

  // find index of this routers routeKey
  var index = sortedKeys.indexOf(router.routeKey);
  if (index > -1) {
    // remove routeKey if it exists
    sortedKeys.splice(index, 1);
  }

  // create router type data obj
  var search = sortedKeys.reduce(function (acc, key, i) {
    acc[key] = i + 1;
    return acc;
  }, {});
  // remove this routeKey from the router type search
  search[router.routeKey] = undefined;

  location.search = _extends({}, location.search, search);

  // const { options } = this.constructor.updateSetLocationOptions(location, { mutateExistingLocation: this.mutateLocationOnStackUpdate });

  // return { pathname: location.pathname, search, options };
  return location;
};

var forward = function forward(location, router, ctx) {
  if (!router.parent) return location;

  var sortedKeys = getRouteKeyOrderings(router);

  // find index of this routers routeKey
  var index = sortedKeys.indexOf(router.routeKey);
  if (index > -1) {
    // remove routeKey if it exists
    sortedKeys.splice(index, 1);
  }

  // move routeKey router forward by one in the ordered routeKey list
  var newIndex = index >= 1 ? index - 1 : 0;
  sortedKeys.splice(newIndex, 0, router.routeKey);

  // create router type data obj
  var search = sortedKeys.reduce(function (acc, key, i) {
    acc[key] = i + 1;
    return acc;
  }, {});

  // const { options } = this.constructor.updateSetLocationOptions(location, { mutateExistingLocation: this.mutateLocationOnStackUpdate });


  // return { pathname: location.pathname, search, options };
  location.search = _extends({}, location.search, search);

  // const { options } = this.constructor.updateSetLocationOptions(location, { mutateExistingLocation: this.mutateLocationOnStackUpdate });

  // return { pathname: location.pathname, search, options };
  return location;
};

var backward = function backward(location, router, ctx) {
  if (!router.parent) return location;

  var sortedKeys = getRouteKeyOrderings(router);

  // find index of this routers routeKey
  var index = sortedKeys.indexOf(router.routeKey);
  if (index > -1) {
    // remove routeKey if it exists
    sortedKeys.splice(index, 1);
  }

  // move routeKey router backward by one in the ordered routeKey list
  var newIndex = index + 1;
  sortedKeys.splice(newIndex, 0, router.routeKey);

  // create router type data obj
  var search = sortedKeys.reduce(function (acc, key, i) {
    acc[key] = i + 1;
    return acc;
  }, {});

  // const { options } = this.constructor.updateSetLocationOptions(location, { mutateExistingLocation: this.mutateLocationOnStackUpdate });

  // return { pathname: location.pathname, search, options };
  // return { pathname: location.pathname, search, options };
  location.search = _extends({}, location.search, search);

  // const { options } = this.constructor.updateSetLocationOptions(location, { mutateExistingLocation: this.mutateLocationOnStackUpdate });

  // return { pathname: location.pathname, search, options };
  return location;
};

var toFront = function toFront(location, router, ctx) {
  // const newLocation = this.constructor.updateSetLocationOptions(location, { mutateExistingLocation: this.mutateLocationOnStackUpdate });

  return router.show(location, router, ctx);
};

var toBack = function toBack(location, router, ctx) {
  if (!router.parent) return location;

  var sortedKeys = getRouteKeyOrderings(router);

  // find index of this routers routeKey
  var index = sortedKeys.indexOf(router.routeKey);
  if (index > -1) {
    // remove routeKey if it exists
    sortedKeys.splice(index, 1);
  }

  // add to back of stack
  sortedKeys.push(router.routeKey);

  // create router type data obj
  var search = sortedKeys.reduce(function (acc, key, i) {
    acc[key] = i + 1;
    return acc;
  }, {});

  // const { options } = this.constructor.updateSetLocationOptions(location, { mutateExistingLocation: this.mutateLocationOnStackUpdate });

  // return { pathname: location.pathname, search, options };
  location.search = _extends({}, location.search, search);

  // const { options } = this.constructor.updateSetLocationOptions(location, { mutateExistingLocation: this.mutateLocationOnStackUpdate });

  // return { pathname: location.pathname, search, options };
  return location;
};

var reducer$1 = function reducer(location, router, ctx) {

  var value = location.search[router.routeKey];

  if (value) {
    return {
      visible: true,
      order: value
    };
  }

  return {
    visible: false,
    order: undefined
    // if (router.isPathRouter) {
    //   newState['visible'] = location.pathname[router.pathLocation] === router.routeKey;
    // } else {
    //   newState['visible'] = location.search[router.routeKey] === 'true';
    // }

    // return newState;
  };
};

// TODO figure out what to do about default states
var defaultState$1 = {
  visible: 'lala'
};

var parser$1 = function parser() {};

var stack = {
  actions: { show: show$1, hide: hide$1, forward: forward, backward: backward, toFront: toFront, toBack: toBack },
  state: defaultState$1,
  reducer: reducer$1,
  parser: parser$1
};

// export { default as data } from './data';

var capitalize = function capitalize() {
  var string = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';

  return string.charAt(0).toUpperCase() + string.slice(1);
};

var Manager = function () {
  function Manager() {
    var _this2 = this;

    var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        routerTree = _ref.routerTree,
        serializedStateStore = _ref.serializedStateStore,
        routerStateStore = _ref.routerStateStore;

    classCallCheck(this, Manager);

    this.routerStateStore = routerStateStore || new DefaultRoutersStateAdapter();
    this.routers = {};
    this.rootRouter = null;

    // check if window 
    if (typeof window === 'undefined') {
      this.serializedStateStore = serializedStateStore || new NativeStore();
    } else {
      this.serializedStateStore = serializedStateStore || new BrowserStore();
    }

    // router types
    var templates = { scene: scene, stack: stack };
    this.routerTypes = {};

    // TODO implement
    // Manager.validateTemplates(templates);
    // validate all template names are unique
    // validation should make sure action names dont collide with any Router method names

    Object.keys(templates).forEach(function (templateName) {
      // create a RouterType off the base Router

      // extend router base for specific type
      var RouterType = function (_Router) {
        inherits(RouterType, _Router);

        function RouterType() {
          classCallCheck(this, RouterType);
          return possibleConstructorReturn(this, (RouterType.__proto__ || Object.getPrototypeOf(RouterType)).apply(this, arguments));
        }

        return RouterType;
      }(RouterBase);

      // change the router name to include the type


      Object.defineProperty(RouterType, 'name', { value: capitalize(templateName) + 'Router' });

      // fetch template
      var selectedTemplate = templates[templateName];

      // add actions to RouterType
      Object.keys(selectedTemplate.actions).forEach(function (actionName) {
        RouterType.prototype[actionName] = Manager.createActionWrapperFunction(selectedTemplate.actions[actionName], actionName);
      });

      // add reducer to RouterType
      RouterType.prototype.reducer = selectedTemplate.reducer;

      // add parser to RouterType
      RouterType.prototype.parser = selectedTemplate.parser;

      _this2.routerTypes[templateName] = RouterType;
    });

    // add initial routers
    this.addRouters(routerTree);

    // subscribe to URL changes and update the router state when this happens
    this.serializedStateStore.subscribeToStateChanges(this.setNewRouterState.bind(this));
  }

  /**
   * Adds the initial routers defined during initialization
   * @param {*} router 
   * 
   */


  createClass(Manager, [{
    key: 'addRouters',
    value: function addRouters() {
      var router = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

      var _this3 = this;

      var type = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
      var parentName = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;

      // If no router specified, there are no routers to add
      if (!router) {
        return;
      }

      // The type is derived by the relationship with the parent. 
      //   Or has none, as is the case with the root router in essence
      //   Below, we are deriving the type and calling the add function recursively by type
      this.addRouter(_extends({}, router, { type: type, parentName: parentName }));
      var childRouters = router.routers || {};
      Object.keys(childRouters).forEach(function (childType) {
        childRouters[childType].forEach(function (child) {
          return _this3.addRouters(child, childType, router.name);
        });
      });
    }
  }, {
    key: 'addRouter',
    value: function addRouter(_ref2) {
      var name = _ref2.name,
          routeKey = _ref2.routeKey,
          config = _ref2.config,
          defaultShow = _ref2.defaultShow,
          disableCaching = _ref2.disableCaching,
          type = _ref2.type,
          parentName = _ref2.parentName;

      // create a router
      var router = this.createRouter({ name: name, routeKey: routeKey, config: config, defaultShow: defaultShow, disableCaching: disableCaching, type: type, parentName: parentName });

      // set as the parent router if this router has not parent and there is not yet a root
      if (!parentName && !this.rootRouter) {
        this.rootRouter = router;
      } else if (!parentName && this.rootRouter) {
        throw new Error('Root router already exists. You likely forgot to specify a parentName');
      } else {
        // fetch the parent, and assign a ref of it to this router
        var parent = this.routers[parentName];

        // TODO migrate code over to use <router>.addChildRouter method instead
        router.parent = parent;

        // add ref of new router to the parent
        var siblingTypes = parent.routers[type] || [];
        siblingTypes.push(router);
        parent.routers[type] = siblingTypes;
      }
      // add ref of new router to manager
      this.routers[name] = router;
    }
  }, {
    key: 'createRouter',


    // create router :specify
    // config = {
    //   routeKey: 'overrides name
    //   mutateExistingLocation: boolean, default: false
    //   cacheState: boolean, default: null, is equal to true
    // }
    value: function createRouter(_ref3) {
      var name = _ref3.name,
          routeKey = _ref3.routeKey,
          config = _ref3.config,
          defaultShow = _ref3.defaultShow,
          disableCaching = _ref3.disableCaching,
          type = _ref3.type,
          parentName = _ref3.parentName;

      var parent = this.routers[parentName];

      var initalParams = {
        name: name,
        // routeKey,
        config: _extends({}, config, { routeKey: routeKey }),
        type: type || 'scene', // make root routers a scene router TODO make root router an empty template
        parent: parent,
        routers: {},
        manager: this,
        root: this.rootRouter,
        defaultShow: defaultShow || false,
        disableCaching: disableCaching,
        getState: this.routerStateStore.createRouterStateGetter(name),
        subscribe: this.routerStateStore.createRouterStateSubscriber(name),
        childCacheStore: this.childCacheStore
      };

      var RouterType = this.routerTypes[type] || this.routerTypes['scene'];

      return new RouterType(initalParams);
    }

    // removing a router will also unset all of its children

  }, {
    key: 'removeRouter',
    value: function removeRouter(name) {
      var _this4 = this;

      var router = this.routers[name];
      var parent = router.parent,
          routers = router.routers,
          type = router.type;

      // delete ref the parent (if any) stores

      if (parent) {
        var routersToKeep = parent.routers[type].filter(function (router) {
          return router.name !== name;
        });
        parent.routers[type] = routersToKeep;
      }

      // recursively call this method for all children
      var childrenTypes = Object.keys(routers);
      childrenTypes.forEach(function (childType) {
        routers[childType].forEach(function (childRouter) {
          return _this4.removeRouter(childRouter.name);
        });
      });

      // delete ref the manager stores
      delete this.routers[name];
    }

    // location -> newState
    // newState -> routerStates :specify

  }, {
    key: 'setNewRouterState',
    value: function setNewRouterState(location) {
      var newState = this.calcNewRouterState(location, this.rootRouter);
      this.routerStateStore.setState(newState);
    }
  }, {
    key: 'calcNewRouterState',
    value: function calcNewRouterState(location, router) {
      var _this5 = this;

      var ctx = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
      var newState = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};

      if (!router) {
        return;
      }

      // calc new router state from new location and existing state
      newState[router.name] = router.reducer(location, router, ctx);

      // recursive call all children to add their state
      Object.keys(router.routers).forEach(function (type) {
        router.routers[type].forEach(function (childRouter) {
          return _this5.calcNewRouterState(location, childRouter, ctx, newState);
        });
      });

      return newState;
    }
  }], [{
    key: 'setChildrenDefaults',
    value: function setChildrenDefaults(location, router, ctx) {
      var newLocation = _extends({}, location);
      Object.keys(router.routers).forEach(function (routerType) {
        router.routers[routerType].forEach(function (child) {

          // if the cached visibility state if 'false' don't show on rehydration
          if (child.cache.state === 'false') {
            return;
          }

          // if there is a cache state or a default visibility, show the router
          if (child.defaultShow || child.cache.state === 'true') {
            // the cache has been 'used' so remove it
            child.cache.removeCache();

            var newContext = _extends({}, ctx, { addingDefaults: true });
            newLocation = child.show(newLocation, child, newContext);
          }
        });
      });

      return newLocation;
    }
  }, {
    key: 'setCacheAndHide',
    value: function setCacheAndHide(location, router) {
      var ctx = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

      var newLocation = location;
      var disableCaching = void 0;

      // figure out if caching should occur
      if (router.disableCaching !== undefined) {
        disableCaching = router.disableCaching;
      } else {
        disableCaching = ctx.disableCaching || false;
      }

      Object.keys(router.routers).forEach(function (routerType) {
        router.routers[routerType].forEach(function (child) {
          // update ctx object's caching attr for this branch 
          ctx.disableCaching = disableCaching;

          // call location action
          newLocation = child.hide(location, child, ctx);
        });
      });

      // use caching figured out above b/c the ctx object might get mutate when
      // transversing the router tree
      if (!disableCaching) {
        router.cache.setCacheFromLocation(newLocation, router);
      }
      return newLocation;
    }

    // wrapper around action function

  }, {
    key: 'createActionWrapperFunction',
    value: function createActionWrapperFunction(action, type) {
      function actionWrapper(existingLocation) {
        var routerInstance = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this;
        var ctx = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

        // if called from another action wrapper
        var updatedLocation = void 0;
        if (existingLocation) {
          // set cache before location changes b/c cache info is derived from location path
          if (type === 'hide') {
            updatedLocation = Manager.setCacheAndHide(existingLocation, routerInstance, ctx);
          }

          updatedLocation = action(existingLocation, routerInstance, ctx);

          if (type === 'show') {
            // add location defaults from children
            updatedLocation = Manager.setChildrenDefaults(updatedLocation, routerInstance, ctx);
          }

          return updatedLocation;
        }

        // if called directly, fetch location
        updatedLocation = this.manager.serializedStateStore.getState();

        // set cache before location changes b/c cache info is derived from location path
        if (type === 'hide') {
          updatedLocation = Manager.setCacheAndHide(updatedLocation, routerInstance, ctx);
        }

        updatedLocation = action(updatedLocation, routerInstance, ctx);

        if (type === 'hide' && routerInstance.state.visible === true) {
          routerInstance.cache.setCache('false');
        }

        if (type === 'show') {
          // add location defaults from children
          updatedLocation = Manager.setChildrenDefaults(updatedLocation, routerInstance, ctx);
        }

        // set serialized state
        this.manager.serializedStateStore.setState(updatedLocation);
      }

      return actionWrapper;
    }
  }, {
    key: 'addLocationDefaults',
    value: function addLocationDefaults(location, routerInstance) {
      var ctx = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

      // TODO validate default action names are on type
      var locationWithDefaults = _extends({}, location);

      Object.keys(routerInstance.routers).forEach(function (type) {
        routerInstance.routers[type].forEach(function (router) {
          if (router.defaultShow || false) {
            var newContext = _extends({}, ctx, { addingDefaults: true });
            locationWithDefaults = router.show(locationWithDefaults, router, newContext);
          }
        });
      });
      return locationWithDefaults;
    }
  }]);
  return Manager;
}();

export default Manager;
export { DefaultRoutersStateAdapter as routerStateStore, NativeStore as NativeSerializedStore, BrowserStore as BrowserSerializedStore, serializer, deserializer };
