'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

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

var strictUriEncode = function (str) {
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
		var test1 = new String('abc');  // eslint-disable-line no-new-wrappers
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
		if (Object.keys(Object.assign({}, test3)).join('') !==
				'abcdefghijklmnopqrst') {
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

var decodeUriComponent = function (encodedURI) {
	if (typeof encodedURI !== 'string') {
		throw new TypeError('Expected `encodedURI` to be of type `string`, got `' + typeof encodedURI + '`');
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
				return value === null ? [
					encode(key, opts),
					'[',
					index,
					']'
				].join('') : [
					encode(key, opts),
					'[',
					encode(index, opts),
					']=',
					encode(value, opts)
				].join('');
			};

		case 'bracket':
			return function (key, value) {
				return value === null ? encode(key, opts) : [
					encode(key, opts),
					'[]=',
					encode(value, opts)
				].join('');
			};

		default:
			return function (key, value) {
				return value === null ? encode(key, opts) : [
					encode(key, opts),
					'=',
					encode(value, opts)
				].join('');
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
	} else if (typeof input === 'object') {
		return keysSorter(Object.keys(input)).sort(function (a, b) {
			return Number(a) - Number(b);
		}).map(function (key) {
			return input[key];
		});
	}

	return input;
}

function parse(str, opts) {
	opts = objectAssign({arrayFormat: 'none'}, opts);

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
		if (Boolean(val) && typeof val === 'object' && !Array.isArray(val)) {
			// Sort object keys, not values
			result[key] = keysSorter(val);
		} else {
			result[key] = val;
		}

		return result;
	}, Object.create(null));
}
var parse_1 = parse;

var stringify = function (obj, opts) {
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

var deserializer = function (serializedLocation) {
    if (serializedLocation === void 0) { serializedLocation = ''; }
    var locationStringParts = serializedLocation.split('?');
    var search = parse_1(locationStringParts[1], { decode: true, arrayFormat: 'bracket' });
    var pathname = locationStringParts[0].split('/').filter(function (s) { return s !== ''; });
    return { search: search, pathname: pathname, options: {} };
};

var DEFAULT_LOCATION = { pathname: [], search: {}, options: {} };
var serializer = function (newLocation, oldLocation) {
    if (oldLocation === void 0) { oldLocation = DEFAULT_LOCATION; }
    var newPathname = newLocation.pathname || [];
    var newSearchObj = newLocation.search || {};
    var oldSearchObj = oldLocation.search || {};
    var combinedSearchObj = __assign({}, oldSearchObj, newSearchObj);
    Object.keys(combinedSearchObj).forEach(function (key) { return (combinedSearchObj[key] == null) && delete combinedSearchObj[key]; });
    var searchString = stringify(combinedSearchObj, { arrayFormat: 'bracket' });
    var pathname = newPathname.join('/');
    var pathnameString = pathname === '' ? '/' : "/" + pathname;
    var location;
    if (searchString === '') {
        location = pathnameString;
    }
    else {
        location = pathnameString + "?" + searchString;
    }
    return { location: location, options: newLocation.options };
};

var NativeStore = (function () {
    function NativeStore(config) {
        this.observers = [];
        this.config = config || { serializer: serializer, deserializer: deserializer, historySize: 10 };
        this.history = [];
        this.currentLocationInHistory = 0;
    }
    NativeStore.prototype.setState = function (unserializedLocation, options) {
        if (options === void 0) { options = {}; }
        var oldUnserializedLocation = this.getState();
        var newState = this.config.serializer(unserializedLocation, oldUnserializedLocation).location;
        if (options.updateHistory !== false) {
            var newHistory = this.history.slice();
            if (unserializedLocation.options && unserializedLocation.options.replaceLocation === true) {
                newHistory.shift();
            }
            newHistory.unshift(newState.slice());
            if (newHistory.length > this.config.historySize) {
                newHistory = newHistory.slice(0, this.config.historySize);
            }
            this.history = newHistory;
        }
        this.notifyObservers();
    };
    NativeStore.prototype.getState = function () { return this.config.deserializer(this.history[this.currentLocationInHistory]); };
    NativeStore.prototype.subscribeToStateChanges = function (fn) { this.observers.push(fn); };
    NativeStore.prototype.unsubscribeFromStateChanges = function (fn) {
        this.observers = this.observers.filter(function (existingFn) { return existingFn !== fn; });
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
        var newLocation = this.currentLocationInHistory - historyChange;
        if (newLocation + 1 <= this.history.length && newLocation >= 0) {
            this.currentLocationInHistory = newLocation;
        }
        else if (newLocation + 1 <= this.history.length) {
            this.currentLocationInHistory = 0;
        }
        else if (newLocation >= 0) {
            this.currentLocationInHistory = this.history.length - 1;
        }
        this.setState(this.getState(), { updateHistory: false });
    };
    NativeStore.prototype.notifyObservers = function () {
        var deserializedState = this.getState();
        this.observers.forEach(function (fn) { return fn(deserializedState); });
    };
    return NativeStore;
}());

var BrowserStore = (function () {
    function BrowserStore(config) {
        var _this = this;
        this.observers = [];
        this.config = config || { serializer: serializer, deserializer: deserializer };
        this.existingLocation = '';
        this.stateWatcher = window.setInterval(function () {
            _this._monitorLocation();
        }, 100);
    }
    BrowserStore.prototype.setState = function (unserializedLocation) {
        var oldUnserializedLocation = this.getState();
        var newState = this.config.serializer(unserializedLocation, oldUnserializedLocation).location;
        if (unserializedLocation.options && unserializedLocation.options.replaceLocation === true) {
            window.history.replaceState({ url: newState }, '', newState);
        }
        else {
            window.history.pushState({ url: newState }, '', newState);
        }
        this.notifyObservers();
    };
    BrowserStore.prototype.getState = function () {
        var searchString = window.location.search || '';
        var pathnameString = window.location.pathname || '';
        return this.config.deserializer(pathnameString + searchString);
    };
    BrowserStore.prototype.subscribeToStateChanges = function (fn) { this.observers.push(fn); };
    BrowserStore.prototype.unsubscribeFromStateChanges = function (fn) {
        this.observers = this.observers.filter(function (existingFn) { return existingFn !== fn; });
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
    BrowserStore.prototype._monitorLocation = function () {
        var newLocation = (window.location.href);
        if (this.existingLocation !== newLocation) {
            this.existingLocation = newLocation;
            this.notifyObservers();
        }
    };
    BrowserStore.prototype.notifyObservers = function () {
        var deserializedState = this.getState();
        this.observers.forEach(function (fn) { return fn(deserializedState); });
    };
    return BrowserStore;
}());

var DefaultRoutersStateStore = (function () {
    function DefaultRoutersStateStore(store, config) {
        if (config === void 0) { config = { historySize: 2 }; }
        this.store = store || {};
        this.config = config;
        this.observers = {};
    }
    DefaultRoutersStateStore.prototype.setState = function (desiredRouterStates) {
        var _this = this;
        var routerNames = Object.keys(desiredRouterStates);
        var hasUpdatedTracker = [];
        this.store = routerNames.reduce(function (routerStates, routerName) {
            var _a = routerStates[routerName] || { current: {}, historical: [] }, prevCurrent = _a.current, historical = _a.historical;
            var newCurrent = desiredRouterStates[routerName];
            if (JSON.stringify(newCurrent) === JSON.stringify(prevCurrent)) {
                return routerStates;
            }
            var newHistorical = historical.slice();
            if (Object.keys(prevCurrent).length > 0) {
                newHistorical.unshift(prevCurrent);
            }
            if (newHistorical.length > _this.config.historySize) {
                newHistorical = newHistorical.slice(0, _this.config.historySize);
            }
            routerStates[routerName] = { current: newCurrent, historical: newHistorical };
            hasUpdatedTracker.push(routerName);
            return routerStates;
        }, __assign({}, this.getState()));
        hasUpdatedTracker.forEach(function (routerName) {
            var observers = _this.observers[routerName] || [];
            if (Array.isArray(observers)) {
                observers.forEach(function (fn) { return fn(_this.store[routerName]); });
            }
        });
    };
    DefaultRoutersStateStore.prototype.createRouterStateGetter = function (routerName) {
        var _this = this;
        return function () { return _this.store[routerName] || {}; };
    };
    DefaultRoutersStateStore.prototype.createRouterStateSubscriber = function (routerName) {
        var _this = this;
        if (!this.observers[routerName]) {
            this.observers[routerName] = [];
        }
        return function (fn) {
            if (Array.isArray(_this.observers[routerName])) {
                _this.observers[routerName].push(fn);
            }
            else {
                _this.observers[routerName] = [fn];
            }
        };
    };
    DefaultRoutersStateStore.prototype.createRouterStateUnsubscriber = function (routerName) {
        var _this = this;
        return function (fn) {
            if (!_this.observers[routerName]) {
                return;
            }
            var observers = _this.observers[routerName];
            _this.observers[routerName] = observers.filter(function (presentObservers) { return presentObservers !== fn; });
        };
    };
    DefaultRoutersStateStore.prototype.unsubscribeAllObserversForRouter = function (routerName) {
        if (!this.observers[routerName]) {
            return;
        }
        delete this.observers[routerName];
    };
    DefaultRoutersStateStore.prototype.getState = function () { return this.store; };
    return DefaultRoutersStateStore;
}());

var Cache = (function () {
    function Cache() {
        this._cacheStore = undefined;
    }
    Object.defineProperty(Cache.prototype, "hasCache", {
        get: function () {
            return !!this._cacheStore;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Cache.prototype, "state", {
        get: function () {
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
    Cache.prototype.setCacheFromLocation = function (location, routerInstance) {
        if (this.hasCache) {
            return;
        }
        var cache;
        if (routerInstance.isPathRouter) {
            cache = !!location.pathname[routerInstance.pathLocation];
        }
        else {
            cache = !!location.search[routerInstance.routeKey];
        }
        this.setCache(cache);
    };
    return Cache;
}());

var RouterBase = (function () {
    function RouterBase(init) {
        var _this = this;
        var name = init.name, config = init.config, type = init.type, manager = init.manager, parent = init.parent, routers = init.routers, root = init.root, getState = init.getState, subscribe = init.subscribe, actions = init.actions;
        if (!name || !type || !manager) {
            throw new Error('Missing required kwargs: name, type, and/or manager');
        }
        this.name = name;
        this.config = config || {};
        if (this.config.defaultShow === undefined) {
            this.config.defaultShow = false;
        }
        this.type = type;
        this.manager = manager;
        this.parent = parent;
        this.routers = routers || {};
        this.root = root;
        this.getState = getState;
        this.subscribe = subscribe;
        this.cache = new Cache();
        (actions || []).forEach(function (actionName) {
            if (_this[actionName]) {
                _this[actionName] = _this[actionName].bind(_this);
            }
        });
    }
    Object.defineProperty(RouterBase.prototype, "routeKey", {
        get: function () {
            return this.config.routeKey || this.name;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RouterBase.prototype, "siblings", {
        get: function () {
            var _this = this;
            return this.parent.routers[this.type].filter(function (r) { return r.name !== _this.name; });
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
        get: function () {
            if (!this.parent) {
                return -1;
            }
            return 1 + this.parent.pathLocation;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RouterBase.prototype, "isRootRouter", {
        get: function () {
            return !this.parent;
        },
        enumerable: true,
        configurable: true
    });
    RouterBase.prototype._addChildRouter = function (router) {
        if (!router.type) {
            throw new Error('Router is missing type');
        }
        var siblingTypes = (this.routers[router.type] || []);
        siblingTypes.push(router);
        this.routers[router.type] = siblingTypes;
        router.parent = this;
    };
    Object.defineProperty(RouterBase.prototype, "isPathRouter", {
        get: function () {
            if (!this.parent) {
                return true;
            }
            if (this.config.isPathRouter && this.parent.isPathRouter) {
                return true;
            }
            if (this.config.isPathRouter) {
                throw new Error(this.type + " router: " + this.name + " is explicitly set to modify the pathname\n        but one of its parent routers doesnt have this permission.\n        Make sure all parents have 'isPathRouter' attribute set to 'true' in the router config OR\n        Make sure all parents are of router type 'scene' or 'data'.\n        If the routers parents have siblings of both 'scene' and 'data' the 'scene' router will always be used for the pathname\n      ");
            }
            if (this.type === 'scene' && this.parent.isPathRouter) {
                var neighboringDataRouters = this.getNeighborsByType('data');
                var isSiblingRouterExplictlyAPathRouter = neighboringDataRouters.reduce(function (acc, r) { return (acc || r.config.isPathRouter === true); }, false);
                if (isSiblingRouterExplictlyAPathRouter === false) {
                    return true;
                }
            }
            else if (this.type === 'data' && this.parent && this.parent.isPathRouter) {
                var neighboringSceneRouters = this.getNeighborsByType('scene');
                return (neighboringSceneRouters.length === 0) && !this.siblings.reduce(function (acc, r) { return (acc || r.config.isPathRouter === true); }, false);
            }
            return false;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RouterBase.prototype, "state", {
        get: function () {
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
        get: function () {
            if (!this.getState) {
                throw new Error('no getState function specified by the manager');
            }
            var historical = this.getState().historical;
            return historical || [];
        },
        enumerable: true,
        configurable: true
    });
    return RouterBase;
}());

var show = function (options, location, router, ctx) {
    if (ctx === void 0) { ctx = {}; }
    location = router.siblings.reduce(function (acc, s) {
        return s.hide(options, acc, s, ctx);
    }, location);
    if (router.isPathRouter) {
        var parent_1 = router.parent;
        if (!ctx.addingDefaults && (!parent_1 || (!parent_1.state.visible && !parent_1.isRootRouter))) {
            return location;
        }
        location.pathname[router.pathLocation] = router.routeKey;
        location.pathname = location.pathname.slice(0, router.pathLocation + 1);
    }
    else {
        location.search[router.routeKey] = true;
    }
    return location;
};
var hide = function (options, location, router, ctx) {
    if (router.isPathRouter) {
        location.pathname = location.pathname.slice(0, router.pathLocation);
    }
    else {
        location.search[router.routeKey] = undefined;
    }
    return location;
};
var reducer = function (location, router, ctx) {
    var newState = {};
    if (router.isPathRouter) {
        newState['visible'] = location.pathname[router.pathLocation] === router.routeKey;
    }
    else {
        newState['visible'] = location.search[router.routeKey] === 'true';
    }
    return newState;
};
var scene = {
    actions: { show: show, hide: hide },
    reducer: reducer,
};

function getRouteKeyOrderings(router) {
    var routeKeyOrderObj = router.parent.routers[router.type].reduce(function (acc, r) {
        if (r.state.visible === false) {
            return acc;
        }
        acc[r.routeKey] = r.state.order;
        return acc;
    }, {});
    var routerRouteKeys = Object.keys(routeKeyOrderObj);
    var orderAsKey = routerRouteKeys.reduce(function (acc, key) {
        var value = routeKeyOrderObj[key];
        if (value != null && !Number.isNaN(value)) {
            acc[routeKeyOrderObj[key]] = key;
        }
        return acc;
    }, {});
    var orders = Object.values(routeKeyOrderObj);
    var filteredOrders = ((orders.filter(function (n) { return n != null && !Number.isNaN(n); })));
    var sortedOrders = filteredOrders.sort(function (a, b) { return a - b; });
    var sortedKeys = sortedOrders.map(function (order) { return orderAsKey[order]; });
    return sortedKeys;
}
var show$1 = function (options, location, router, ctx) {
    if (!router.parent) {
        return location;
    }
    var sortedKeys = getRouteKeyOrderings(router);
    var index = sortedKeys.indexOf(router.routeKey);
    if (index > -1) {
        sortedKeys.splice(index, 1);
    }
    sortedKeys.unshift(router.routeKey);
    var search = sortedKeys.reduce(function (acc, key, i) {
        acc[key] = i + 1;
        return acc;
    }, {});
    location.search = __assign({}, location.search, search);
    return location;
};
var hide$1 = function (options, location, router, ctx) {
    if (!router.parent) {
        return location;
    }
    var sortedKeys = getRouteKeyOrderings(router);
    var index = sortedKeys.indexOf(router.routeKey);
    if (index > -1) {
        sortedKeys.splice(index, 1);
    }
    var search = sortedKeys.reduce(function (acc, key, i) {
        acc[key] = i + 1;
        return acc;
    }, {});
    search[router.routeKey] = undefined;
    location.search = __assign({}, location.search, search);
    return location;
};
var forward = function (options, location, router, ctx) {
    if (!router.parent) {
        return location;
    }
    var sortedKeys = getRouteKeyOrderings(router);
    var index = sortedKeys.indexOf(router.routeKey);
    if (index > -1) {
        sortedKeys.splice(index, 1);
    }
    var newIndex = index >= 1 ? index - 1 : 0;
    sortedKeys.splice(newIndex, 0, router.routeKey);
    var search = sortedKeys.reduce(function (acc, key, i) {
        acc[key] = i + 1;
        return acc;
    }, {});
    location.search = __assign({}, location.search, search);
    return location;
};
var backward = function (options, location, router, ctx) {
    if (!router.parent) {
        return location;
    }
    var sortedKeys = getRouteKeyOrderings(router);
    var index = sortedKeys.indexOf(router.routeKey);
    if (index > -1) {
        sortedKeys.splice(index, 1);
    }
    var newIndex = index + 1;
    sortedKeys.splice(newIndex, 0, router.routeKey);
    var search = sortedKeys.reduce(function (acc, key, i) {
        acc[key] = i + 1;
        return acc;
    }, {});
    location.search = __assign({}, location.search, search);
    return location;
};
var toFront = function (options, location, router, ctx) {
    return router.show(options, location, router, ctx);
};
var toBack = function (options, location, router, ctx) {
    if (!router.parent) {
        return location;
    }
    var sortedKeys = getRouteKeyOrderings(router);
    var index = sortedKeys.indexOf(router.routeKey);
    if (index > -1) {
        sortedKeys.splice(index, 1);
    }
    sortedKeys.push(router.routeKey);
    var search = sortedKeys.reduce(function (acc, key, i) {
        acc[key] = i + 1;
        return acc;
    }, {});
    location.search = __assign({}, location.search, search);
    return location;
};
var reducer$1 = function (location, router, ctx) {
    var value = location.search[router.routeKey];
    if (value) {
        return {
            order: value,
            visible: true,
        };
    }
    return {
        order: undefined,
        visible: false,
    };
};
var stack = {
    actions: { show: show$1, hide: hide$1, forward: forward, backward: backward, toFront: toFront, toBack: toBack },
    reducer: reducer$1,
};

var show$2 = function (options, location, router, ctx) {
    if (ctx === void 0) { ctx = {}; }
    var data = options.data || router.state.data;
    if (router.isPathRouter) {
        var parent_1 = router.parent;
        location.pathname[router.pathLocation] = data;
        location.pathname = location.pathname.slice(0, router.pathLocation + 1);
    }
    else {
        location.search[router.routeKey] = data;
    }
    return location;
};
var hide$2 = function (options, location, router, ctx) {
    if (router.isPathRouter) {
        location.pathname = location.pathname.slice(0, router.pathLocation);
    }
    else {
        location.search[router.routeKey] = undefined;
    }
    return location;
};
var setData = function (options, location, router, ctx) {
    if (ctx === void 0) { ctx = {}; }
    return router.show(options);
};
var reducer$2 = function (location, router, ctx) {
    var newState = {};
    var routerData;
    if (router.isPathRouter) {
        routerData = location.pathname[router.pathLocation];
    }
    else {
        routerData = location.search[router.routeKey];
    }
    if (routerData) {
        newState['visible'] = true;
    }
    newState['data'] = routerData || router.state.data;
    return newState;
};
var data = {
    actions: { show: show$2, hide: hide$2, setData: setData },
    reducer: reducer$2,
};

var show$3 = function (options, location, router, ctx) {
    if (ctx === void 0) { ctx = {}; }
    location.search[router.routeKey] = true;
    return location;
};
var hide$3 = function (options, location, router, ctx) {
    location.search[router.routeKey] = undefined;
    return location;
};
var reducer$3 = function (location, router, ctx) {
    var newState = {};
    newState['visible'] = location.search[router.routeKey] === 'true';
    return newState;
};
var feature = {
    actions: { show: show$3, hide: hide$3 },
    reducer: reducer$3,
};

var capitalize = function (name) {
    if (name === void 0) { name = ''; }
    return name.charAt(0).toUpperCase() + name.slice(1);
};
var Manager = (function () {
    function Manager(_a) {
        var _b = _a === void 0 ? {} : _a, routerTree = _b.routerTree, serializedStateStore = _b.serializedStateStore, routerStateStore = _b.routerStateStore, router = _b.router, templates = _b.templates;
        var _this = this;
        this.routerStateStore = routerStateStore || new DefaultRoutersStateStore();
        this.routers = {};
        this.rootRouter = null;
        if (typeof window === 'undefined') {
            this.serializedStateStore = serializedStateStore || new NativeStore();
        }
        else {
            this.serializedStateStore = serializedStateStore || new BrowserStore();
        }
        this.templates = __assign({ scene: scene, stack: stack, data: data, feature: feature }, templates);
        this.routerTypes = {};
        var Router = router || RouterBase;
        Object.keys(this.templates).forEach(function (templateName) {
            var RouterType = (function (_super) {
                __extends(RouterType, _super);
                function RouterType() {
                    return _super !== null && _super.apply(this, arguments) || this;
                }
                return RouterType;
            }(Router));
            Object.defineProperty(RouterType, 'name', { value: capitalize(templateName) + "Router" });
            var selectedTemplate = _this.templates[templateName];
            Object.keys(selectedTemplate.actions).forEach(function (actionName) {
                RouterType.prototype[actionName] = Manager.createActionWrapperFunction(selectedTemplate.actions[actionName], actionName);
            });
            RouterType.prototype.reducer = selectedTemplate.reducer;
            _this.routerTypes[templateName] = RouterType;
        });
        this.addRouters(routerTree);
        this.serializedStateStore.subscribeToStateChanges(this.setNewRouterState.bind(this));
    }
    Manager.setChildrenDefaults = function (options, location, router, ctx) {
        var newLocation = __assign({}, location);
        Object.keys(router.routers).forEach(function (routerType) {
            router.routers[routerType].forEach(function (child) {
                if (child.cache.state === false) {
                    return;
                }
                if (child.config.defaultShow || child.cache.state === true) {
                    child.cache.removeCache();
                    var newContext = __assign({}, ctx, { addingDefaults: true });
                    newLocation = child.show(options, newLocation, child, newContext);
                }
            });
        });
        return newLocation;
    };
    Manager.setCacheAndHide = function (options, location, router, ctx) {
        if (ctx === void 0) { ctx = {}; }
        var newLocation = location;
        var disableCaching;
        if (router.config.disableCaching !== undefined) {
            disableCaching = router.config.disableCaching;
        }
        else {
            disableCaching = ctx.disableCaching || false;
        }
        Object.keys(router.routers).forEach(function (routerType) {
            router.routers[routerType].forEach(function (child) {
                ctx.disableCaching = disableCaching;
                newLocation = child.hide(options, location, child, ctx);
            });
        });
        if (!disableCaching) {
            router.cache.setCacheFromLocation(newLocation, router);
        }
        return newLocation;
    };
    Manager.createActionWrapperFunction = function (action, type) {
        function actionWrapper(options, existingLocation, routerInstance, ctx) {
            if (routerInstance === void 0) { routerInstance = this; }
            if (ctx === void 0) { ctx = {}; }
            var updatedLocation;
            if (existingLocation) {
                if (type === 'hide') {
                    updatedLocation = Manager.setCacheAndHide(options, existingLocation, routerInstance, ctx);
                }
                updatedLocation = action(options, existingLocation, routerInstance, ctx);
                if (type === 'show') {
                    updatedLocation = Manager.setChildrenDefaults(options, updatedLocation, routerInstance, ctx);
                }
                return updatedLocation;
            }
            updatedLocation = this.manager.serializedStateStore.getState();
            if (type === 'hide') {
                updatedLocation = Manager.setCacheAndHide(options, updatedLocation, routerInstance, ctx);
            }
            updatedLocation = action(options, updatedLocation, routerInstance, ctx);
            if (type === 'hide' && routerInstance.state.visible === true) {
                routerInstance.cache.setCache(false);
            }
            if (type === 'show') {
                updatedLocation = Manager.setChildrenDefaults(options, updatedLocation, routerInstance, ctx);
            }
            updatedLocation.options = __assign({}, updatedLocation.options, options);
            this.manager.serializedStateStore.setState(updatedLocation);
        }
        return actionWrapper;
    };
    Manager.prototype.addRouters = function (router, type, parentName) {
        var _this = this;
        if (router === void 0) { router = null; }
        if (type === void 0) { type = null; }
        if (parentName === void 0) { parentName = null; }
        if (!router) {
            return;
        }
        this.addRouter(__assign({}, router, { type: type, parentName: parentName }));
        var childRouters = router.routers || {};
        Object.keys(childRouters).forEach(function (childType) {
            childRouters[childType].forEach(function (child) { return _this.addRouters(child, childType, router.name); });
        });
    };
    Manager.prototype.addRouter = function (_a) {
        var name = _a.name, routeKey = _a.routeKey, disableCaching = _a.disableCaching, defaultShow = _a.defaultShow, type = _a.type, parentName = _a.parentName;
        var config = {
            disableCaching: disableCaching,
            defaultShow: defaultShow || false,
            routeKey: routeKey,
        };
        var router = this.createRouter({ name: name, config: config, type: type, parentName: parentName });
        if (!parentName && !this.rootRouter) {
            this.rootRouter = router;
        }
        else if (!parentName && this.rootRouter) {
            throw new Error('Root router already exists. You likely forgot to specify a parentName');
        }
        else if (this.routers[parentName] === undefined) {
            throw new Error('Parent of to be created router not found');
        }
        else {
            var parent_1 = this.routers[parentName];
            router.parent = parent_1;
            var siblingTypes = parent_1.routers[type] || [];
            siblingTypes.push(router);
            parent_1.routers[type] = siblingTypes;
        }
        this.routers[name] = router;
    };
    Manager.prototype.removeRouter = function (name) {
        var _this = this;
        var router = this.routers[name];
        var parent = router.parent, routers = router.routers, type = router.type;
        if (parent) {
            var routersToKeep = parent.routers[type].filter(function (child) { return child.name !== name; });
            parent.routers[type] = routersToKeep;
        }
        var childrenTypes = Object.keys(routers);
        childrenTypes.forEach(function (childType) {
            routers[childType].forEach(function (childRouter) { return _this.removeRouter(childRouter.name); });
        });
        this.routerStateStore.unsubscribeAllObserversForRouter(name);
        delete this.routers[name];
    };
    Manager.prototype.calcNewRouterState = function (location, router, ctx, newState) {
        var _this = this;
        if (ctx === void 0) { ctx = {}; }
        if (newState === void 0) { newState = {}; }
        if (!router) {
            return;
        }
        if (!router.isRootRouter) {
            newState[router.name] = router.reducer(location, router, ctx);
        }
        Object.keys(router.routers)
            .forEach(function (type) {
            router.routers[type]
                .forEach(function (childRouter) { return _this.calcNewRouterState(location, childRouter, ctx, newState); });
        });
        return newState;
    };
    Manager.prototype.validateRouterDeclaration = function (name, type, config) {
        if (this.routers[name]) {
            throw new Error("A router with the name '" + name + "' already exists.");
        }
        if (config.routeKey) {
            var alreadyExists = Object.values(this.routers).reduce(function (acc, r) {
                return acc || r.routeKey === config.routeKey;
            }, false);
            if (alreadyExists) {
                throw new Error("A router with the routeKey '" + config.routeKey + "' already exists");
            }
        }
    };
    Manager.prototype.createNewRouterInitArgs = function (_a) {
        var name = _a.name, config = _a.config, type = _a.type, parentName = _a.parentName;
        var parent = this.routers[parentName];
        return {
            name: name,
            config: __assign({}, config),
            type: type || 'scene',
            parent: parent,
            routers: {},
            manager: this,
            root: this.rootRouter,
            getState: this.routerStateStore.createRouterStateGetter(name),
            subscribe: this.routerStateStore.createRouterStateSubscriber(name),
        };
    };
    Manager.prototype.createRouterFromInitArgs = function (initalArgs, routerActionNames) {
        var routerClass = this.routerTypes[initalArgs.type];
        return new routerClass(__assign({}, initalArgs, { actions: routerActionNames }));
    };
    Manager.prototype.setNewRouterState = function (location) {
        var newState = this.calcNewRouterState(location, this.rootRouter);
        this.routerStateStore.setState(newState);
    };
    Manager.prototype.createRouter = function (_a) {
        var name = _a.name, config = _a.config, type = _a.type, parentName = _a.parentName;
        this.validateRouterDeclaration(name, type, config);
        var initalArgs = this.createNewRouterInitArgs({ name: name, config: config, type: type, parentName: parentName });
        var routerActionNames = Object.keys(this.templates[initalArgs.type].actions);
        return this.createRouterFromInitArgs(initalArgs, routerActionNames);
    };
    return Manager;
}());



var index = /*#__PURE__*/Object.freeze({

});

exports.Manager = Manager;
exports.Router = RouterBase;
exports.RouterStore = DefaultRoutersStateStore;
exports.NativeSerializedStore = NativeStore;
exports.BrowserSerializedStore = BrowserStore;
exports.serializer = serializer;
exports.deserializer = deserializer;
exports.Types = index;
