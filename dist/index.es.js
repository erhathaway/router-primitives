/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */
/* global Reflect, Promise */

var extendStatics = function(d, b) {
    extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return extendStatics(d, b);
};

function __extends(d, b) {
    extendStatics(d, b);
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}

var __assign = function() {
    __assign = Object.assign || function __assign(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};

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
var parse_1 = parse;

var stringify = function stringify(obj, opts) {
	var defaults = {
		encode: true,
		strict: true,
		arrayFormat: 'none'
	};

	opts = objectAssign(defaults, opts);

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

var deserializer = function deserializer(serializedLocation) {
    if (serializedLocation === void 0) {
        serializedLocation = '';
    }
    var locationStringParts = serializedLocation.split('?');
    var search = parse_1(locationStringParts[1], { decode: true, arrayFormat: 'bracket' });
    var pathname = locationStringParts[0].split('/').filter(function (s) {
        return s !== '';
    });
    return { search: search, pathname: pathname, options: {} };
};

var DEFAULT_LOCATION = { pathname: [], search: { test: true }, options: {} };
var serializer = function serializer(newLocation, oldLocation) {
    if (oldLocation === void 0) {
        oldLocation = DEFAULT_LOCATION;
    }
    var newPathname = newLocation.pathname || [];
    var newSearchObj = newLocation.search || {};
    var oldSearchObj = oldLocation.search || {};
    var combinedSearchObj = __assign({}, oldSearchObj, newSearchObj);
    Object.keys(combinedSearchObj).forEach(function (key) {
        return combinedSearchObj[key] == null && delete combinedSearchObj[key];
    });
    var searchString = stringify(combinedSearchObj, { arrayFormat: 'bracket' });
    var pathname = newPathname.join('/');
    var pathnameString = pathname === '' ? '/' : pathname;
    var location;
    if (searchString === '') {
        location = pathnameString;
    } else {
        location = pathnameString + "?" + searchString;
    }
    return { location: location, options: newLocation.options };
};

/**
 * The store that the router manager uses to write and read from the serialized state
 * The serialized state store is what, on the web, holds the URL - aka the serilaized state of the router tree
 * For non web, or when manager.config.serializedStateStore === 'native' this store is used
 * The default serialized state is a string for this store
 */
var NativeStore = /** @class */function () {
    function NativeStore(state, config) {
        this.observers = [];
        this.config = config || { serializer: serializer, deserializer: deserializer, historySize: 10 };
        this.history = [];
        this.currentLocationInHistory = 0;
        // TODO remove once tests are ported over to TS
        this.state = state;
    }
    // unserialized state = { pathname: [], search: {}, options: {} }
    // options = { updateHistory }
    NativeStore.prototype.setState = function (unserializedLocation, options) {
        if (options === void 0) {
            options = {};
        }
        var oldUnserializedLocation = this.getState();
        var newState = this.config.serializer(unserializedLocation, oldUnserializedLocation).location;
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
    };
    NativeStore.prototype.getState = function () {
        return this.config.deserializer(this.history[this.currentLocationInHistory]);
    };
    NativeStore.prototype.subscribeToStateChanges = function (fn) {
        this.observers.push(fn);
    };
    // unsubscribeToStateChanges // TODO fill me in!
    NativeStore.prototype.notifyObservers = function () {
        var deserializedState = this.getState();
        this.observers.forEach(function (fn) {
            return fn(deserializedState);
        });
    };
    NativeStore.prototype.back = function () {
        this.go(-1);
    };
    NativeStore.prototype.forward = function () {
        this.go(1);
    };
    NativeStore.prototype.go = function (historyChange) {
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
    };
    return NativeStore;
}();

/**
 * The store that the router manager uses to write and read from the serialized state
 * The serialized state store is what, on the web, holds the URL - aka the serilaized state of the router tree
 * The default serialized state is the URL for this store
 */
var BrowserStore = /** @class */function () {
    function BrowserStore(state, config) {
        var _this = this;
        this.observers = [];
        this.config = config || { serializer: serializer, deserializer: deserializer };
        // TODO remove this and delete state param in constructor once tests are rewritten in TS
        this.state = state;
        // subscribe to location changes
        this.existingLocation = '';
        this.stateWatcher = window.setInterval(function () {
            _this._monitorLocation();
        }, 100);
    }
    BrowserStore.prototype._monitorLocation = function () {
        var newLocation = window.location.href;
        if (this.existingLocation !== newLocation) {
            this.existingLocation = newLocation;
            this.notifyObservers();
        }
    };
    // unserialized state = { pathname: [], search: {}, options: {} }
    // options = { updateHistory }
    BrowserStore.prototype.setState = function (unserializedLocation) {
        var oldUnserializedLocation = this.getState();
        var newState = this.config.serializer(unserializedLocation, oldUnserializedLocation).location;
        if (unserializedLocation.options && unserializedLocation.options.replaceLocation === true) {
            window.history.replaceState({ url: newState }, '', newState);
        } else {
            window.history.pushState({ url: newState }, '', newState);
        }
        this.notifyObservers();
    };
    BrowserStore.prototype.notifyObservers = function () {
        var deserializedState = this.getState();
        this.observers.forEach(function (fn) {
            return fn(deserializedState);
        });
    };
    BrowserStore.prototype.getState = function () {
        var searchString = window.location.search || '';
        var pathnameString = window.location.pathname || '';
        return this.config.deserializer(pathnameString + searchString);
    };
    BrowserStore.prototype.subscribeToStateChanges = function (fn) {
        this.observers.push(fn);
    };
    BrowserStore.prototype.back = function () {
        window.history.back();
    };
    BrowserStore.prototype.forward = function () {
        window.history.forward();
    };
    BrowserStore.prototype.go = function (historyChange) {
        window.history.go(historyChange);
    };
    return BrowserStore;
}();

/**
 * The default router state store.
 * This store keeps track of each routers state which is derived from the current location
 * This store can be swaped out in the manager with other stores. For example, a redux store.
 * Stores must implement the methods:
 *   setState
 *   getState
 *   createRouterStateGetter
 *   createRouterStateSubscriber
 */
var DefaultRoutersStateStore = /** @class */function () {
    function DefaultRoutersStateStore(store, config) {
        if (config === void 0) {
            config = { historySize: 2 };
        }
        this.store = store || {};
        this.config = config;
        this.observers = {}; // key is routerName
    }
    /**
     * Sets the state of the router state store by adding to the history.
     * Adding state will completly overwrite existing state.
     * If the new contains routers whose state is identical to old state
     *   the router callbacks wont be called for this router. Otherwise, if the state
     *   has changed in any way, callback will be fired off for the router.
     */
    DefaultRoutersStateStore.prototype.setState = function (desiredRouterStates) {
        var _this = this;
        var routerNames = Object.keys(desiredRouterStates);
        // Keeps track of which routers have new state.
        // Used to notify observers of new state changes on a router by router level
        var hasUpdatedTracker = [];
        this.store = routerNames.reduce(function (routerStates, routerName) {
            // extract current and historical states
            var _a = routerStates[routerName] || { current: {}, historical: [] },
                prevCurrent = _a.current,
                historical = _a.historical;
            var newCurrent = desiredRouterStates[routerName];
            // skip routers who haven't been updated
            // TODO test performance of this JSON.stringify comparison
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
            routerStates[routerName] = { current: newCurrent, historical: newHistorical };
            // record which routers have had a state change
            hasUpdatedTracker.push(routerName);
            return routerStates;
        }, __assign({}, this.getState()));
        // call observers of all routers that have had state changes
        hasUpdatedTracker.forEach(function (routerName) {
            var observers = _this.observers[routerName] || [];
            if (Array.isArray(observers)) {
                observers.forEach(function (fn) {
                    return fn(_this.store[routerName]);
                });
            }
        });
    };
    /**
     * Returns a function which has a router name in closure scope.
     * The returned function is used for getting the router store state for a specific router.
     */
    DefaultRoutersStateStore.prototype.createRouterStateGetter = function (routerName) {
        var _this = this;
        return function () {
            return _this.store[routerName] || {};
        };
    };
    /**
     * Returns a function which as the router name in closure scope.
     * The returned function is used subscribe observers to changes in
     *   a single routers state.
     */
    DefaultRoutersStateStore.prototype.createRouterStateSubscriber = function (routerName) {
        var _this = this;
        return function (fn) {
            if (Array.isArray(_this.observers[routerName])) {
                _this.observers[routerName].push(fn);
            } else {
                _this.observers[routerName] = [fn];
            }
        };
    };
    /**
     * Returns the stores state for all routers
     */
    DefaultRoutersStateStore.prototype.getState = function () {
        return this.store;
    };
    return DefaultRoutersStateStore;
}();

/**
 * Used to manipulate the router cache
 * Cache is set when a router 'hides'
 * Depending on the router type logic, a router can use its
 * cache when setting new state instead of a default value
 */
var Cache = /** @class */function () {
    function Cache() {
        this._cacheStore = undefined;
    }
    Object.defineProperty(Cache.prototype, "hasCache", {
        get: function get() {
            return !!this._cacheStore;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Cache.prototype, "state", {
        get: function get() {
            return this._cacheStore;
        },
        enumerable: true,
        configurable: true
    });
    Cache.prototype.removeCache = function () {
        this._cacheStore = undefined;
    };
    Cache.prototype.setCache = function (value) {
        this._cacheStore = value;
    };
    // TODO Fix this any type once Router has a type definition
    Cache.prototype.setCacheFromLocation = function (location, routerInstance) {
        // dont set cache if one already exists!
        if (this.hasCache) {
            return;
        }
        var cache;
        if (routerInstance.isPathRouter) {
            cache = location.pathname[routerInstance.pathLocation];
        } else {
            cache = !!location.search[routerInstance.routeKey];
        }
        this.setCache(cache);
    };
    return Cache;
}();

var RouterBase = /** @class */function () {
    function RouterBase(init) {
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
        // this.actionNames = []; // used to map over the actions and replace with the actionHandler closure
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
    Object.defineProperty(RouterBase.prototype, "routeKey", {
        get: function get() {
            return this.config.routeKey || this.name;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RouterBase.prototype, "shouldStoreLocationMutationInHistory", {
        get: function get() {
            return this.config.shouldStoreLocationMutationInHistory;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RouterBase.prototype, "siblings", {
        get: function get() {
            var _this = this;
            return this.parent.routers[this.type].filter(function (r) {
                return r.name !== _this.name;
            });
        },
        enumerable: true,
        configurable: true
    });
    RouterBase.prototype.getNeighborsByType = function (type) {
        if (this.parent && this.parent.routers) {
            return this.parent.routers[type] || [];
        }
        return [];
    };
    Object.defineProperty(RouterBase.prototype, "pathLocation", {
        get: function get() {
            if (!this.parent) return -1;
            return 1 + this.parent.pathLocation;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RouterBase.prototype, "isRootRouter", {
        get: function get() {
            return !this.parent;
        },
        enumerable: true,
        configurable: true
    });
    // TODO Remove testing dependency - this shouldn't be used since it bypasses the manager
    // Create utility function instead to orchestrate relationships between routers
    RouterBase.prototype._addChildRouter = function (router) {
        if (!router.type) {
            throw new Error('Router is missing type');
        }
        var siblingTypes = this.routers[router.type] || [];
        siblingTypes.push(router);
        this.routers[router.type] = siblingTypes;
        router.parent = this;
    };
    Object.defineProperty(RouterBase.prototype, "isPathRouter", {
        get: function get() {
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
                throw new Error(this.type + " router: " + this.name + " is explicitly set to modify the pathname\n        but one of its parent routers doesnt have this permission.\n        Make sure all parents have 'isPathRouter' attribute set to 'true' in the router config OR\n        Make sure all parents are of router type 'scene' or 'data'.\n        If the routers parents have siblings of both 'scene' and 'data' the 'scene' router will always be used for the pathname\n      ");
            }
            if (this.type === 'scene' && this.parent.isPathRouter) {
                // check to make sure neighboring data routers arent explicitly set to modify the pathname
                var neighboringDataRouters = this.getNeighborsByType('data');
                var isSiblingRouterExplictlyAPathRouter = neighboringDataRouters.reduce(function (acc, r) {
                    return (
                        // check all data router neighbors and
                        // make sure none have been explicitly set to be a path router
                        acc || r.config.isPathRouter === true
                    );
                }, false);
                if (isSiblingRouterExplictlyAPathRouter === false) return true;
            } else if (this.type === 'data' && this.parent && this.parent.isPathRouter) {
                if (this.isPathRouter === false) return false;
                // check to make sure neighboring scene routers aren't present
                var neighboringSceneRouters = this.getNeighborsByType('scene');
                return neighboringSceneRouters.length === 0 && !this.siblings.reduce(function (acc, r) {
                    return (
                        // check all data router siblings and
                        // make sure none are path routers
                        acc || r.config.isPathRouter === true
                    );
                }, false);
            }
            return false;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RouterBase.prototype, "state", {
        get: function get() {
            if (!this.getState) {
                throw new Error('no getState function specified by the manager');
            }
            var current = this.getState().current;
            return current || {};
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RouterBase.prototype, "history", {
        get: function get() {
            if (!this.getState) {
                throw new Error('no getState function specified by the manager');
            }
            var historical = this.getState().historical;
            return historical || [];
        },
        enumerable: true,
        configurable: true
    });
    // TODO deprecate this method and remove tests
    // return pathLocation cached data types
    RouterBase.prototype.calcCachedLocation = function (globalState) {
        if (globalState === void 0) {
            globalState = null;
        }
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
    };
    // TODO deprecate this function and remove tests
    RouterBase.joinLocationWithCachedLocation = function (location, cachedLocation) {
        var newLocation = __assign({}, location);
        if (cachedLocation.isPathData) {
            newLocation.path[cachedLocation.pathLocation] = cachedLocation.value;
        } else {
            newLocation.search[cachedLocation.queryParam] = cachedLocation.value;
        }
        return newLocation;
    };
    return RouterBase;
}();

var show = function show(location, router, ctx) {
    if (ctx === void 0) {
        ctx = {};
    }
    // hide sibling routers
    location = router.siblings.reduce(function (acc, s) {
        return s.hide(acc, s, ctx);
    }, location);
    if (router.isPathRouter) {
        var parent_1 = router.parent;
        if (!ctx.addingDefaults && (!parent_1 || !parent_1.state.visible && !parent_1.isRootRouter)) {
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
var scene = {
    actions: { show: show, hide: hide },
    // state: defaultState,
    reducer: reducer
};

// returns the routeKey names of visible routers based on the ordering of their 'order' state
function getRouteKeyOrderings(router) {
    // creates an object of { [visible router routeKey]: order }
    var routeKeyOrderObj = router.parent.routers[router.type].reduce(function (acc, r) {
        if (r.state.visible === false) {
            return acc;
        }
        // TODO use generics to handle state type
        acc[r.routeKey] = r.state.order;
        return acc;
    }, {});
    /**
     * { <routeKeyName>: <order> }
     */
    // reduce the order object to the array of sorted keys
    var routerRouteKeys = Object.keys(routeKeyOrderObj);
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
    location.search = __assign({}, location.search, search);
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
    location.search = __assign({}, location.search, search);
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
    location.search = __assign({}, location.search, search);
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
    location.search = __assign({}, location.search, search);
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
    location.search = __assign({}, location.search, search);
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
    };
    // if (router.isPathRouter) {
    //   newState['visible'] = location.pathname[router.pathLocation] === router.routeKey;
    // } else {
    //   newState['visible'] = location.search[router.routeKey] === 'true';
    // }
    // return newState;
};
var stack = {
    actions: { show: show$1, hide: hide$1, forward: forward, backward: backward, toFront: toFront, toBack: toBack },
    // state: defaultState,
    reducer: reducer$1
};

// export { default as data } from './data';

var capitalize = function capitalize(string) {
    if (string === void 0) {
        string = '';
    }
    return string.charAt(0).toUpperCase() + string.slice(1);
};
var Manager = /** @class */function () {
    function Manager(_a) {
        var _b = _a === void 0 ? {} : _a,
            routerTree = _b.routerTree,
            serializedStateStore = _b.serializedStateStore,
            routerStateStore = _b.routerStateStore;
        var _this = this;
        this.routerStateStore = routerStateStore || new DefaultRoutersStateStore();
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
            var RouterType = /** @class */function (_super) {
                __extends(RouterType, _super);
                function RouterType() {
                    return _super !== null && _super.apply(this, arguments) || this;
                }
                return RouterType;
            }(RouterBase);
            // change the router name to include the type
            Object.defineProperty(RouterType, 'name', { value: capitalize(templateName) + "Router" });
            // fetch template
            var selectedTemplate = templates[templateName];
            // add actions to RouterType
            Object.keys(selectedTemplate.actions).forEach(function (actionName) {
                RouterType.prototype[actionName] = Manager.createActionWrapperFunction(selectedTemplate.actions[actionName], actionName);
            });
            // add reducer to RouterType
            RouterType.prototype.reducer = selectedTemplate.reducer;
            // add parser to RouterType
            // RouterType.prototype.parser = selectedTemplate.parser;
            _this.routerTypes[templateName] = RouterType;
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
    Manager.prototype.addRouters = function (router, type, parentName) {
        var _this = this;
        if (router === void 0) {
            router = null;
        }
        if (type === void 0) {
            type = null;
        }
        if (parentName === void 0) {
            parentName = null;
        }
        // If no router specified, there are no routers to add
        if (!router) {
            return;
        }
        // The type is derived by the relationship with the parent.
        //   Or has none, as is the case with the root router in essence
        //   Below, we are deriving the type and calling the add function recursively by type
        this.addRouter(__assign({}, router, { type: type, parentName: parentName }));
        var childRouters = router.routers || {};
        Object.keys(childRouters).forEach(function (childType) {
            childRouters[childType].forEach(function (child) {
                return _this.addRouters(child, childType, router.name);
            });
        });
    };
    Manager.prototype.addRouter = function (_a) {
        var name = _a.name,
            routeKey = _a.routeKey,
            config = _a.config,
            defaultShow = _a.defaultShow,
            disableCaching = _a.disableCaching,
            type = _a.type,
            parentName = _a.parentName;
        // create a router
        var router = this.createRouter({ name: name, routeKey: routeKey, config: config, defaultShow: defaultShow, disableCaching: disableCaching, type: type, parentName: parentName });
        console.log("NAMEEEEE", name);
        // set as the parent router if this router has not parent and there is not yet a root
        if (!parentName && !this.rootRouter) {
            this.rootRouter = router;
        } else if (!parentName && this.rootRouter) {
            throw new Error('Root router already exists. You likely forgot to specify a parentName');
        } else {
            // fetch the parent, and assign a ref of it to this router
            var parent_1 = this.routers[parentName];
            // TODO migrate code over to use <router>.addChildRouter method instead
            router.parent = parent_1;
            // add ref of new router to the parent
            var siblingTypes = parent_1.routers[type] || [];
            siblingTypes.push(router);
            parent_1.routers[type] = siblingTypes;
        }
        // add ref of new router to manager
        this.routers[name] = router;
    };
    Manager.setChildrenDefaults = function (location, router, ctx) {
        var newLocation = __assign({}, location);
        Object.keys(router.routers).forEach(function (routerType) {
            router.routers[routerType].forEach(function (child) {
                // if the cached visibility state if 'false' don't show on rehydration
                if (child.cache.state === false) {
                    return;
                }
                // if there is a cache state or a default visibility, show the router
                if (child.defaultShow || child.cache.state === true) {
                    // the cache has been 'used' so remove it
                    child.cache.removeCache();
                    var newContext = __assign({}, ctx, { addingDefaults: true });
                    newLocation = child.show(newLocation, child, newContext);
                }
            });
        });
        return newLocation;
    };
    Manager.setCacheAndHide = function (location, router, ctx) {
        if (ctx === void 0) {
            ctx = {};
        }
        var newLocation = location;
        var disableCaching;
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
    };
    // wrapper around action function
    Manager.createActionWrapperFunction = function (action, type) {
        function actionWrapper(existingLocation, routerInstance, ctx) {
            if (routerInstance === void 0) {
                routerInstance = this;
            }
            if (ctx === void 0) {
                ctx = {};
            }
            // if called from another action wrapper
            var updatedLocation;
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
                routerInstance.cache.setCache(false);
            }
            if (type === 'show') {
                // add location defaults from children
                updatedLocation = Manager.setChildrenDefaults(updatedLocation, routerInstance, ctx);
            }
            // set serialized state
            this.manager.serializedStateStore.setState(updatedLocation);
        }
        return actionWrapper;
    };
    Manager.addLocationDefaults = function (location, routerInstance, ctx) {
        if (ctx === void 0) {
            ctx = {};
        }
        // TODO validate default action names are on type
        var locationWithDefaults = __assign({}, location);
        Object.keys(routerInstance.routers).forEach(function (type) {
            routerInstance.routers[type].forEach(function (router) {
                if (router.defaultShow || false) {
                    var newContext = __assign({}, ctx, { addingDefaults: true });
                    locationWithDefaults = router.show(locationWithDefaults, router, newContext);
                }
            });
        });
        return locationWithDefaults;
    };
    // create router :specify
    // config = {
    //   routeKey: 'overrides name
    //   mutateExistingLocation: boolean, default: false
    //   cacheState: boolean, default: null, is equal to true
    // }
    Manager.prototype.createRouter = function (_a) {
        var name = _a.name,
            routeKey = _a.routeKey,
            config = _a.config,
            defaultShow = _a.defaultShow,
            disableCaching = _a.disableCaching,
            type = _a.type,
            parentName = _a.parentName;
        var parent = this.routers[parentName];
        var initalParams = {
            name: name,
            // routeKey,
            config: __assign({}, config, { routeKey: routeKey }),
            type: type || 'scene',
            parent: parent,
            routers: {},
            manager: this,
            root: this.rootRouter,
            defaultShow: defaultShow || false,
            disableCaching: disableCaching,
            getState: this.routerStateStore.createRouterStateGetter(name),
            subscribe: this.routerStateStore.createRouterStateSubscriber(name)
        };
        var RouterType = this.routerTypes[type] || this.routerTypes.scene;
        return new (RouterType(initalParams))();
    };
    // removing a router will also unset all of its children
    Manager.prototype.removeRouter = function (name) {
        var _this = this;
        var router = this.routers[name];
        var parent = router.parent,
            routers = router.routers,
            type = router.type;
        // delete ref the parent (if any) stores
        if (parent) {
            var routersToKeep = parent.routers[type].filter(function (child) {
                return child.name !== name;
            });
            parent.routers[type] = routersToKeep;
        }
        // recursively call this method for all children
        var childrenTypes = Object.keys(routers);
        childrenTypes.forEach(function (childType) {
            routers[childType].forEach(function (childRouter) {
                return _this.removeRouter(childRouter.name);
            });
        });
        // delete ref the manager stores
        delete this.routers[name];
    };
    // location -> newState
    // newState -> routerStates :specify
    Manager.prototype.setNewRouterState = function (location) {
        var newState = this.calcNewRouterState(location, this.rootRouter);
        this.routerStateStore.setState(newState);
    };
    Manager.prototype.calcNewRouterState = function (location, router, ctx, newState) {
        var _this = this;
        if (ctx === void 0) {
            ctx = {};
        }
        if (newState === void 0) {
            newState = {};
        }
        if (!router) {
            return;
        }
        // calc new router state from new location and existing state
        newState[router.name] = router.reducer(location, router, ctx);
        // recursive call all children to add their state
        Object.keys(router.routers).forEach(function (type) {
            router.routers[type].forEach(function (childRouter) {
                return _this.calcNewRouterState(location, childRouter, ctx, newState);
            });
        });
        return newState;
    };
    return Manager;
}();

export default Manager;
export { DefaultRoutersStateStore as routerStateStore, NativeStore as NativeSerializedStore, BrowserStore as BrowserSerializedStore, serializer, deserializer };
