import { observable, computed } from 'mobx';

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

var defineProperty = function (obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
};

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

var defaultOptions = { mutateExistingLocation: false };
var updateLocation = function updateLocation(_ref) {
  var pathname = _ref.pathname,
      search = _ref.search;
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : defaultOptions;

  if (window && window.history) {
    var url = pathname + '?' + search;
    if (options.mutateExistingLocation) {
      window.history.replaceState({ url: url }, '', url);
    } else {
      window.history.pushState({ url: url }, '', url);
    }
  }
  // TODO rewrite not using MST
  // getRoot(self).updateLocation({ pathname, search, state })
  // routerHistory.push({ pathname, search, state });
};

var setLocation = function setLocation(newLocation, oldLocation) {
  var newPathname = newLocation.pathname,
      newSearchObj = newLocation.search;
  var oldSearchObj = oldLocation.search;


  var combinedSearchObj = _extends({}, oldSearchObj, newSearchObj);
  Object.keys(combinedSearchObj).forEach(function (key) {
    return combinedSearchObj[key] == null && delete combinedSearchObj[key];
  });

  var search = queryString.stringify(combinedSearchObj, { arrayFormat: 'bracket' });
  var pathname = newPathname.join('/');

  var cleansedPathname = pathname === '' ? '/' : pathname;

  updateLocation({ pathname: cleansedPathname, search: search }, newLocation.options);
};

var existingLocation = void 0;

var registerRouter$$1 = function registerRouter$$1(router) {
  router.state = { visible: true };

  window.setInterval(function () {
    var newLocation = window.location.href;
    if (existingLocation !== newLocation) {
      existingLocation = newLocation;
      router._update(Router.routerLocation());
    }
  }, 100);
};

var createRouter = function createRouter(routerInfo, existingRouters, RouterClass) {
  var childRouterInfo = routerInfo.routers;
  var params = routerInfo;
  delete routerInfo.routers; // eslint-disable-line no-param-reassign

  var parentRouter = new RouterClass(params);
  existingRouters[routerInfo.name] = parentRouter; // eslint-disable-line no-param-reassign

  return { parentRouter: parentRouter, childRouterInfo: childRouterInfo };
};

var addChildRoutersToParentRouter = function addChildRoutersToParentRouter(childRouterInfo, parentRouter, existingRouters, RouterClass) {
  // eslint-disable-line max-len
  var routerTypes = Object.keys(childRouterInfo || {});

  routerTypes.forEach(function (type) {
    var routersByType = childRouterInfo[type];
    var producedRouters = routersByType.map(function (r) {
      var _createRouter = createRouter(r, existingRouters, RouterClass),
          newParentRouter = _createRouter.parentRouter,
          newChildRouterInfo = _createRouter.childRouterInfo;

      addChildRoutersToParentRouter(newChildRouterInfo, newParentRouter, existingRouters, RouterClass);
      return newParentRouter;
    });
    parentRouter.routers = defineProperty({}, type, producedRouters); // eslint-disable-line no-param-reassign
  });
};

var initalizeRouter = function initalizeRouter(RouterClass) {
  return function (routerInfo) {
    var existingRouters = {};

    var _createRouter2 = createRouter(_extends({}, routerInfo, { name: 'root' }), existingRouters, RouterClass),
        parentRouter = _createRouter2.parentRouter,
        childRouterInfo = _createRouter2.childRouterInfo;

    if (childRouterInfo) addChildRoutersToParentRouter(childRouterInfo, parentRouter, existingRouters, RouterClass);

    return existingRouters;
  };
};

/**
 * Extract state from location (pathname and search)
 */
var extractScene = function extractScene(_ref, routeKeys, isPathRouter, routerLevel) {
  var pathname = _ref.pathname,
      search = _ref.search;

  if (isPathRouter) {
    var scenePresent = pathname[routerLevel];

    var data = {};
    routeKeys.forEach(function (key) {
      data[key] = false;
    });
    if (routeKeys.includes(scenePresent)) {
      if (scenePresent) data[scenePresent] = true;
    }
    return data;
  }

  var extractedScenes = routeKeys.reduce(function (acc, key) {
    acc[key] = search[key] != null;
    return acc;
  }, {});

  return extractedScenes;
};

var extractStack = function extractStack(_ref2, routeKeys) {
  var search = _ref2.search;

  // const parsedQuery = queryString.parse(location.search, { decode: true, arrayFormat: 'bracket' });
  // obj representes the extracted stack data
  var obj = {};
  routeKeys.forEach(function (key) {
    var order = +search[key];
    obj[key] = order != null && !Number.isNaN(order) ? order : undefined;
  });

  // remove undefined keys;
  Object.keys(obj).forEach(function (key) {
    return obj[key] == null && delete obj[key];
  });

  return obj;
};

var extractFeature = function extractFeature(_ref3, routeKeys) {
  var search = _ref3.search;

  var obj = routeKeys.reduce(function (acc, key) {
    acc[key] = search[key] != null;

    return acc;
  }, {});

  return obj;
};

var extractData = function extractData(_ref4, routeKeys, isPathRouter, routerLevel, router) {
  var pathname = _ref4.pathname,
      search = _ref4.search;

  if (isPathRouter) {
    var dataPresent = pathname[routerLevel];

    var data = {};
    routeKeys.forEach(function (key) {
      data[key] = undefined;
    });
    if (router && router.state && dataPresent === router.state.data) {
      data[router.routeKey] = dataPresent;
    }
    return data;
  }

  var obj = {};
  routeKeys.forEach(function (key) {
    obj[key] = search[key];
  });
  return obj;
};

/**
 * Mixins that give the base router SceneRouting functionality
 * Notably, a scene router needs specific #showScene, #hideScene, and #updateScene methods
*/
var SceneRouter = {
  showScene: function showScene(location) {
    var _this = this;

    var _constructor$updateSe = this.constructor.updateSetLocationOptions(location, { mutateExistingLocation: this.mutateLocationOnSceneUpdate }),
        options = _constructor$updateSe.options;

    var search = {};

    // if router has a parent, get sibling router types and set visiblity to false
    // also used to clear existing search state related to router type which is useful for debuging
    if (this.parent) {
      this.parent.routers[this.type].forEach(function (r) {
        if (r.routeKey !== _this.routeKey) {
          var updatedLocation = r.hide();
          search = _extends({}, search, updatedLocation.search);
        } else {
          search[r.routeKey] = undefined;
        }
      });
    }

    // if router is a pathrouter update the pathname
    if (this.isPathRouter) {
      // dont update pathname if parent isn't visible
      if (this.parent && !this.parent.visible) return location;

      var pathname = location.pathname;

      pathname[this.routerLevel] = this.routeKey;
      var newPathname = pathname.slice(0, this.routerLevel + 1);

      return { pathname: newPathname, search: search, options: options };
    }

    search[this.routeKey] = true;

    return { pathname: location.pathname, search: search, options: options };
  },
  hideScene: function hideScene(location) {
    var _constructor$updateSe2 = this.constructor.updateSetLocationOptions(location, { mutateExistingLocation: this.mutateLocationOnSceneUpdate }),
        options = _constructor$updateSe2.options;

    var search = {};

    // if router has a parent, get sibling router types and set visiblity to false
    // also used to clear existing search state related to router type which is useful for debuging
    if (this.parent) {
      this.parent.routers[this.type].forEach(function (r) {
        search[r.routeKey] = undefined;
      });
    }

    if (this.isPathRouter) {
      var pathname = location.pathname;

      var newPathname = pathname.slice(0, this.routerLevel);

      return { pathname: newPathname, search: search, options: options };
    }
    return { pathname: location.pathname, search: search, options: options };
  },
  updateScene: function updateScene(parentState, parentContext, location) {
    var routerTypeData = extractScene(location, parentContext.routeKeys, this.isPathRouter, this.routerLevel);
    var visible = routerTypeData[this.routeKey];

    return {
      visible: visible,
      order: undefined,
      at: routerTypeData
    };
  }
};

/**
 * Mixins that give the base router DataRouting functionality
 * Notably, a data router needs specific #showData, #hideData, #setData, and #updateData methods
*/
var DataRouter = {
  showData: function showData(location) {
    if (!this.parent) return location;

    var _constructor$updateSe = this.constructor.updateSetLocationOptions(location, { mutateExistingLocation: this.mutateLocationOnDataUpdate }),
        options = _constructor$updateSe.options;

    if (this.isPathRouter) {
      var _search = {};
      // dont update pathname if it has a parent and parent isn't visible
      if (this.parent && !this.parent.visible) return { pathname: location.pathname, search: _search, options: location.options };

      var pathname = location.pathname;

      pathname[this.routerLevel] = this.state.data;
      return { pathname: pathname, search: _search, options: options };
    }

    var search = defineProperty({}, this.routeKey, this.state ? this.state.data : undefined);

    return { pathname: location.pathname, search: search, options: options };
  },
  hideData: function hideData(location) {
    var search = defineProperty({}, this.routeKey, undefined);

    var _constructor$updateSe2 = this.constructor.updateSetLocationOptions(location, { mutateExistingLocation: this.mutateLocationOnDataUpdate }),
        options = _constructor$updateSe2.options;

    if (this.isPathRouter) {
      var pathname = location.pathname;

      var newPathname = pathname.slice(0, this.routerLevel);
      return { pathname: newPathname, search: search, options: options };
    }

    return { pathname: location.pathname, search: search, options: options };
  },
  setData: function setData(data) {
    this.state.data = data;
    this.show();
  },
  updateData: function updateData(parentState, parentContext, location) {
    var routerTypeData = extractData(location, parentContext.routeKeys, this.isPathRouter, this.routerLevel, this);
    var visible = Object.values(routerTypeData).filter(function (i) {
      return i != null;
    }).length > 0;

    // only set data if there is data to set
    var data = routerTypeData[this.routeKey] ? { data: routerTypeData[this.routeKey] } : {};
    return _extends({
      visible: visible,
      order: undefined,
      at: routerTypeData
    }, data);
  }
};

/**
 * Mixins that give the base router FeatureRouting functionality
 * Notably, a feature router needs specific #showFeature, #hideFeature, and #updateFeature methods
*/
var FeatureRouter = {
  showFeature: function showFeature(location) {
    var search = defineProperty({}, this.routeKey, true);

    var _constructor$updateSe = this.constructor.updateSetLocationOptions(location, { mutateExistingLocation: this.mutateLocationOnFeatureUpdate }),
        options = _constructor$updateSe.options;

    return { pathname: location.pathname, search: search, options: options };
  },
  hideFeature: function hideFeature(location) {
    var search = defineProperty({}, this.routeKey, undefined);

    var _constructor$updateSe2 = this.constructor.updateSetLocationOptions(location, { mutateExistingLocation: this.mutateLocationOnFeatureUpdate }),
        options = _constructor$updateSe2.options;

    return { pathname: location.pathname, search: search, options: options };
  },
  updateFeature: function updateFeature(parentState, parentContext, location) {
    var routerTypeData = extractFeature(location, parentContext.routeKeys);
    var visible = routerTypeData[this.routeKey];

    return {
      visible: visible,
      order: undefined,
      at: routerTypeData
    };
  }
};

// takes an object of keys where the value's
// represent order and turns it into an array of ordered keys
function orderStackRouteKeys(routeKeyOrderObj) {
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

/**
 * Mixins that give the base router StackRouting functionality
 * Notably, a stack router needs specific #showStack, #hideStack,
 * #moveForwardStack, #moveBackwardStack, #bringToFrontStack, #sendToBackStack,
 * and #updateStack methods
*/
var StackRouter = {
  showStack: function showStack(location) {
    if (!this.parent) return location;

    // get routeKeys that belong to this router type
    var typeRouterRouteKeys = this.parent.routers[this.type].map(function (t) {
      return t.routeKey;
    });
    // get current order for all routeKeys via the location state
    var routerTypeData = extractStack(location, typeRouterRouteKeys);
    var sortedKeys = orderStackRouteKeys(routerTypeData);

    // find index of this routers routeKey
    var index = sortedKeys.indexOf(this.routeKey);
    if (index > -1) {
      // remove routeKey if it exists
      sortedKeys.splice(index, 1);
    }
    // add route key to front of sorted keys
    sortedKeys.unshift(this.routeKey);

    // create router type data obj
    var search = sortedKeys.reduce(function (acc, key, i) {
      acc[key] = i + 1;
      return acc;
    }, {});

    var _constructor$updateSe = this.constructor.updateSetLocationOptions(location, { mutateExistingLocation: this.mutateLocationOnStackUpdate }),
        options = _constructor$updateSe.options;

    return { pathname: location.pathname, search: search, options: options };
  },
  hideStack: function hideStack(location) {
    if (!this.parent) return location;

    // get routeKeys that belong to this router type
    var typeRouterRouteKeys = this.parent.routers[this.type].map(function (t) {
      return t.routeKey;
    });
    // get current order for all routeKeys via the location state
    var routerTypeData = extractStack(location, typeRouterRouteKeys);
    var sortedKeys = orderStackRouteKeys(routerTypeData);

    // find index of this routers routeKey
    var index = sortedKeys.indexOf(this.routeKey);
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
    search[this.routeKey] = undefined;

    var _constructor$updateSe2 = this.constructor.updateSetLocationOptions(location, { mutateExistingLocation: this.mutateLocationOnStackUpdate }),
        options = _constructor$updateSe2.options;

    return { pathname: location.pathname, search: search, options: options };
  },
  moveForwardStack: function moveForwardStack(location) {
    if (!this.parent) return location;

    // get routeKeys that belong to this router type
    var typeRouterRouteKeys = this.parent.routers[this.type].map(function (t) {
      return t.routeKey;
    });
    // get current order for all routeKeys via the location state
    var routerTypeData = extractStack(location, typeRouterRouteKeys);
    var sortedKeys = orderStackRouteKeys(routerTypeData);

    // find index of this routers routeKey
    var index = sortedKeys.indexOf(this.routeKey);
    if (index > -1) {
      // remove routeKey if it exists
      sortedKeys.splice(index, 1);
    }

    // move routeKey router forward by one in the ordered routeKey list
    var newIndex = index >= 1 ? index - 1 : 0;
    sortedKeys.splice(newIndex, 0, this.routeKey);

    // create router type data obj
    var search = sortedKeys.reduce(function (acc, key, i) {
      acc[key] = i + 1;
      return acc;
    }, {});

    var _constructor$updateSe3 = this.constructor.updateSetLocationOptions(location, { mutateExistingLocation: this.mutateLocationOnStackUpdate }),
        options = _constructor$updateSe3.options;

    return { pathname: location.pathname, search: search, options: options };
  },
  moveBackwardStack: function moveBackwardStack(location) {
    if (!this.parent) return location;

    // get routeKeys that belong to this router type
    var typeRouterRouteKeys = this.parent.routers[this.type].map(function (t) {
      return t.routeKey;
    });
    // get current order for all routeKeys via the location state
    var routerTypeData = extractStack(location, typeRouterRouteKeys);
    var sortedKeys = orderStackRouteKeys(routerTypeData);

    // find index of this routers routeKey
    var index = sortedKeys.indexOf(this.routeKey);
    if (index > -1) {
      // remove routeKey if it exists
      sortedKeys.splice(index, 1);
    }

    // move routeKey router backward by one in the ordered routeKey list
    var newIndex = index + 1;
    sortedKeys.splice(newIndex, 0, this.routeKey);

    // create router type data obj
    var search = sortedKeys.reduce(function (acc, key, i) {
      acc[key] = i + 1;
      return acc;
    }, {});

    var _constructor$updateSe4 = this.constructor.updateSetLocationOptions(location, { mutateExistingLocation: this.mutateLocationOnStackUpdate }),
        options = _constructor$updateSe4.options;

    return { pathname: location.pathname, search: search, options: options };
  },
  bringToFrontStack: function bringToFrontStack(location) {
    var newLocation = this.constructor.updateSetLocationOptions(location, { mutateExistingLocation: this.mutateLocationOnStackUpdate });

    return this.showStack(newLocation);
  },
  sendToBackStack: function sendToBackStack(location) {
    if (!this.parent) return location;

    // get routeKeys that belong to this router type
    var typeRouterRouteKeys = this.parent.routers[this.type].map(function (t) {
      return t.routeKey;
    });
    // get current order for all routeKeys via the location state
    var routerTypeData = extractStack(location, typeRouterRouteKeys);
    var sortedKeys = orderStackRouteKeys(routerTypeData);

    // find index of this routers routeKey
    var index = sortedKeys.indexOf(this.routeKey);
    if (index > -1) {
      // remove routeKey if it exists
      sortedKeys.splice(index, 1);
    }

    // add to back of stack
    sortedKeys.push(this.routeKey);

    // create router type data obj
    var search = sortedKeys.reduce(function (acc, key, i) {
      acc[key] = i + 1;
      return acc;
    }, {});

    var _constructor$updateSe5 = this.constructor.updateSetLocationOptions(location, { mutateExistingLocation: this.mutateLocationOnStackUpdate }),
        options = _constructor$updateSe5.options;

    return { pathname: location.pathname, search: search, options: options };
  },
  updateStack: function updateStack(parentState, parentContext, location) {
    var routerTypeData = extractStack(location, parentContext.routeKeys);
    var order = routerTypeData[this.routeKey];

    return {
      visible: order != null,
      order: order,
      at: routerTypeData
    };
  }
};

var _class, _descriptor;

function _initDefineProp(target, property, descriptor, context) {
  if (!descriptor) return;
  Object.defineProperty(target, property, {
    enumerable: descriptor.enumerable,
    configurable: descriptor.configurable,
    writable: descriptor.writable,
    value: descriptor.initializer ? descriptor.initializer.call(context) : void 0
  });
}

function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) {
  var desc = {};
  Object['ke' + 'ys'](descriptor).forEach(function (key) {
    desc[key] = descriptor[key];
  });
  desc.enumerable = !!desc.enumerable;
  desc.configurable = !!desc.configurable;

  if ('value' in desc || desc.initializer) {
    desc.writable = true;
  }

  desc = decorators.slice().reverse().reduce(function (desc, decorator) {
    return decorator(target, property, desc) || desc;
  }, desc);

  if (context && desc.initializer !== void 0) {
    desc.value = desc.initializer ? desc.initializer.call(context) : void 0;
    desc.initializer = undefined;
  }

  if (desc.initializer === void 0) {
    Object['define' + 'Property'](target, property, desc);
    desc = null;
  }

  return desc;
}

// types
var Router = (_class = function () {
  createClass(Router, [{
    key: 'state',
    get: function get$$1() {
      return this._state;
    },
    set: function set$$1(state) {
      Object.keys(state).forEach(function (key) {
        return state[key] === undefined ? delete state[key] : '';
      });

      state.visible = state.visible || false;
      state.from = this.history.at;

      this._state = _extends({}, this.state, state);
    }
  }, {
    key: 'visible',
    get: function get$$1() {
      return this.state.visible;
    }
  }, {
    key: 'order',
    get: function get$$1() {
      return this.state.order;
    }
  }, {
    key: 'history',
    get: function get$$1() {
      return { at: this.state.at, from: this.state.from };
    }
  }, {
    key: 'data',
    get: function get$$1() {
      return this.state.data;
    }

    // Private attributes

    // undefined so it can be explicitly set to true or false to override parent settings

  }], [{
    key: 'updateSetLocationOptions',


    /**
     * This is a utility method for helping to set location options
     * The location object has a pathname obj, search obj, and options obj.
     * This removes undefined keys from the options obj before merging in the new options
     */
    value: function updateSetLocationOptions(location, newOptions) {
      // Only add the mutateExistingLocation if it hasn't already explicitly been set.
      // The mutateExistingLocation option prevents location mutation.
      // This prevents additional history from being added to location history.
      // Ex: You have modal popups and want the back button to return to the previous scene not close the modal
      var options = location.options;

      if (newOptions.mutateExistingLocation && location.options.mutateExistingLocation === undefined) {
        options = _extends({}, options, newOptions);
      }
      delete newOptions.mutateExistingLocation;
      options = _extends({}, options, newOptions);

      return { pathname: location.pathname, search: location.search, options: options };
    }

    /*
     * Utility methods for extracting the Location object from the Web API or Router data store
     * The location object has a pathname obj, search obj, and options obj
     */

  }, {
    key: 'searchString',
    value: function searchString() {
      return window.location.search || '';
    }
  }, {
    key: 'pathnameString',
    value: function pathnameString() {
      return window.location.pathname || '';
    }
  }, {
    key: 'routerLocation',
    value: function routerLocation() {
      var search = queryString.parse(Router.searchString(), { decode: true, arrayFormat: 'bracket' });
      var pathname = Router.pathnameString().split('/');

      return { search: search, pathname: pathname, options: { mutateExistingLocation: undefined } };
    }

    /**
     * Utility method for capitalizing the first letter of a string.
     * This is primarily used for dynamically generating method names for different router types.
     * For example, if you call <Router>#show() on a scene router <Router>.type === 'scene',
     *  The #show method will make a call to the #showScene method.
     * This type of name generation allows for easy Router type definitions:
     *  Just define custom hide, show, and update methods in the form `hide<RouterType>`
    */

  }, {
    key: 'capitalize',
    value: function capitalize() {
      var string = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';

      return string.charAt(0).toUpperCase() + string.slice(1);
    }
  }]);

  function Router(config) {
    classCallCheck(this, Router);

    _initDefineProp(this, '_state', _descriptor, this);

    this._childTreeVisibilityOnHide = {};
    this._routers = {};
    this._parent = undefined;
    this._isPathRouter = undefined;
    this._mutateLocationOnSceneUpdate = false;
    this._mutateLocationOnStackUpdate = true;
    this._mutateLocationOnDataUpdate = false;
    this._mutateLocationOnFeatureUpdate = false;
    this._rehydrateChildRoutersState = undefined;

    // add router mixins that imbue various router types
    Object.assign(this, SceneRouter, DataRouter, FeatureRouter, StackRouter);

    var name = config.name,
        routeKey = config.routeKey,
        routers = config.routers,
        visible = config.visible,
        order = config.order,
        isPathRouter = config.isPathRouter,
        state = config.state,
        rehydrateChildRoutersState = config.rehydrateChildRoutersState,
        mutateLocationOnSceneUpdate = config.mutateLocationOnSceneUpdate,
        mutateLocationOnStackUpdate = config.mutateLocationOnStackUpdate,
        mutateLocationOnDataUpdate = config.mutateLocationOnDataUpdate,
        mutateLocationOnFeatureUpdate = config.mutateLocationOnFeatureUpdate;

    // this.visible = visible || false;

    this.state = {
      visible: visible || false,
      order: order
    };
    // this.order = order;
    this.name = name;
    this.routeKey = routeKey ? routeKey.trim() : this.name.trim();
    this._isPathRouter = isPathRouter;
    this._rehydrateChildRoutersState = rehydrateChildRoutersState;
    // if (hooks) this.hooks = hooks;
    if (routers) this.routers = routers;

    if (state && (typeof state === 'undefined' ? 'undefined' : _typeof(state)) === 'object') {
      this.state = state;
    } else if (state) {
      throw 'The initial state object passed to a router constructor must be an object';
    }

    if (mutateLocationOnSceneUpdate) this.mutateLocationOnSceneUpdate = mutateLocationOnSceneUpdate;
    if (mutateLocationOnStackUpdate) this.mutateLocationOnStackUpdate = mutateLocationOnStackUpdate;
    if (mutateLocationOnDataUpdate) this.mutateLocationOnDataUpdate = mutateLocationOnDataUpdate;
    if (mutateLocationOnFeatureUpdate) this.mutateLocationOnFeatureUpdate = mutateLocationOnFeatureUpdate;

    this.show = this.show.bind(this);
    this.hide = this.hide.bind(this);
    this.bringToFront = this.bringToFront.bind(this);
    this.sendToBack = this.sendToBack.bind(this);
    this.moveForward = this.moveForward.bind(this);
    this.moveBackward = this.moveBackward.bind(this);
  }

  createClass(Router, [{
    key: 'removeRouteKeyFromChildTreeVisibilityOnHide',
    value: function removeRouteKeyFromChildTreeVisibilityOnHide(routeKeyToDelete) {
      var allRecordings = this.root._childTreeVisibilityOnHide;
      var allRoutersWithVisibilityRecordings = Object.keys(allRecordings);
      allRoutersWithVisibilityRecordings.forEach(function (rK) {
        var recording = allRecordings[rK];
        if (recording && recording[routeKeyToDelete] != null) {
          delete recording[routeKeyToDelete];
          allRecordings[rK] = recording;
        }
      });

      this.root._childTreeVisibilityOnHide = allRecordings;
    }
  }, {
    key: 'updateLocationViaMethod',
    value: function updateLocationViaMethod(location, methodNamePrefix) {
      var methodName = '' + methodNamePrefix + Router.capitalize(this.type);
      if (methodName === methodNamePrefix) {
        throw 'router type attribute is undefined for router with name: ' + this.name;
      }

      try {
        // an object with { pathname, search }
        // where pathname is a string
        // and search is an object of routeKeys belonging to a routerType
        // and their value (usually boolean | int)
        var newLocation = this[methodName](location);
        return newLocation;
      } catch (e) {
        if (e.message === 'this[methodName] is not a function') {
          throw '#' + methodNamePrefix + ' method is not implemented for router type: ' + this.type;
        } else {
          throw e;
        }
      }
    }

    // get hasHistory() {
    //   return true
    // }

    // get hasDefault() {
    //   // TODO enable defaults
    //   return true; // eslint-disable-line class-methods-use-this
    // }

  }, {
    key: 'isDescendentOf',
    value: function isDescendentOf(parentKey) {
      if (this.parent) {
        return this.routeKey === parentKey || this.parent.isDescendentOf(parentKey);
      }
      return this.routeKey === parentKey;
    }
  }, {
    key: 'rollBackToMostRecentState',
    value: function rollBackToMostRecentState(_ref, router, ctx) {
      var pathname = _ref.pathname,
          search = _ref.search,
          options = _ref.options;
      var previousVisibility = ctx.previousVisibility;

      if (previousVisibility[router.routeKey] === false || previousVisibility[router.routeKey] == null) return { pathname: pathname, search: search, options: options };

      if (this.isPathRouter && router.type === 'data') {
        pathname[router.routerLevel] = router.state && router.state.data ? router.state.data : undefined;
      } else if (this.isPathRouter) {
        pathname[router.routerLevel] = previousVisibility[router.routeKey];
      } else if (router.type === 'data') {
        search[router.routeKey] = router.state ? router.state.data : router.data;
      } else {
        search[router.routeKey] = previousVisibility[router.routeKey];
      }
      return { pathname: pathname, search: search, options: options };
    }

    // useDefault(location: Location) {
    //   return location;
    // }

    // repopulate tree state

  }, {
    key: 'show',
    value: function show() {
      var isOriginalCall = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;
      var existingLocation = arguments[1];

      var METHOD_NAME_PREFIX = 'show';
      var oldLocation = existingLocation || Router.routerLocation();

      if (isOriginalCall && !this.visible) {
        // if a direct call was made to a show method, make sure some other router cant later
        // change the state by rehydrating from the cached child tree visiblity
        this.removeRouteKeyFromChildTreeVisibilityOnHide(this.routeKey);

        var ctx = {
          originRouteKey: this.routeKey,
          rehydrateChildRoutersState: this._rehydrateChildRoutersState,
          previousVisibility: _extends({}, this.childTreeVisibilityOnHide)
        };
        this.childTreeVisibilityOnHide = {};

        var _newLocation = Router.reduceStateTree(oldLocation, this, Router.updateLocationFnShow, ctx);

        setLocation(_newLocation, oldLocation);
        return _newLocation;
      }
      this.childTreeVisibilityOnHide = {};

      var newLocation = this.updateLocationViaMethod(oldLocation, METHOD_NAME_PREFIX);
      return newLocation;
    }

    // all routers implement this method

  }, {
    key: 'hide',
    value: function hide() {
      var isOriginalCall = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;
      var existingLocation = arguments[1];

      var METHOD_NAME_PREFIX = 'hide';
      var oldLocation = existingLocation || Router.routerLocation();

      if (isOriginalCall) {
        this.removeRouteKeyFromChildTreeVisibilityOnHide(this.routeKey);
      }
      if (isOriginalCall && this.visible) {
        // capture state of sub tree, so we can repopulate it correctly
        this.childTreeVisibilityOnHide = Router.getChildTreeVisibility(this);
        var ctx = {
          originRouteKey: this.routeKey,
          rehydrateChildRoutersState: this._rehydrateChildRoutersState,
          originalLocation: oldLocation
        };

        var _newLocation2 = Router.reduceStateTree(oldLocation, this, Router.updateLocationFnHide, ctx);

        setLocation(_newLocation2, oldLocation);
        return _newLocation2;
      }
      var newLocation = this.updateLocationViaMethod(oldLocation, METHOD_NAME_PREFIX);
      return newLocation;
    }

    // only stack router implements this method

  }, {
    key: 'moveForward',
    value: function moveForward() {
      var METHOD_NAME_PREFIX = 'moveForward';
      var oldLocation = Router.routerLocation();
      var newLocation = this.updateLocationViaMethod(oldLocation, METHOD_NAME_PREFIX);

      setLocation(newLocation, oldLocation);
    }

    // only stack router implements this method

  }, {
    key: 'moveBackward',
    value: function moveBackward() {
      var METHOD_NAME_PREFIX = 'moveBackward';
      var oldLocation = Router.routerLocation();
      var newLocation = this.updateLocationViaMethod(oldLocation, METHOD_NAME_PREFIX);

      setLocation(newLocation, oldLocation);
    }

    // only stack router implements this method

  }, {
    key: 'bringToFront',
    value: function bringToFront() {
      var METHOD_NAME_PREFIX = 'bringToFront';
      var oldLocation = Router.routerLocation();
      var newLocation = this.updateLocationViaMethod(oldLocation, METHOD_NAME_PREFIX);

      setLocation(newLocation, oldLocation);
    }

    // only stack router implements this method

  }, {
    key: 'sendToBack',
    value: function sendToBack() {
      var METHOD_NAME_PREFIX = 'sendToBack';
      var oldLocation = Router.routerLocation();
      var newLocation = this.updateLocationViaMethod(oldLocation, METHOD_NAME_PREFIX);

      setLocation(newLocation, oldLocation);
    }
  }, {
    key: '_update',
    value: function _update(newLocation) {
      var _this = this;

      var location = newLocation;

      var routerTypes = Object.keys(this.routers);
      routerTypes.forEach(function (type) {
        // pass new location to child routers
        var routers = _this.routers[type];
        if (Array.isArray(routers)) {
          // add all routeKeys that belong to this router type
          var context = { routeKeys: routers.map(function (t) {
              return t.routeKey;
            }) };
          routers.forEach(function (r) {
            try {
              // get new state for specific router
              var newRouterState = r['update' + Router.capitalize(type)](r.state, context, location);

              if (newRouterState) r.state = newRouterState;
              if (r && r._update) r._update(location);
            } catch (e) {
              if (e.message === '_this[("update" + Router.capitalize(...))] is not a function') {
                throw 'Missing update function "update' + Router.capitalize(type) + '" for router type ' + type;
              } else {
                throw e;
              }
            }
          });
        } else {
          throw 'Routers must be passed to a router type as an Array ex: { stack: [{ name: "Im a stack router" }, { name: "Stack2" }]}';
        }
      });
    }
  }, {
    key: 'root',
    set: function set$$1(router) {
      this.root = router;
      throw 'You shouldnt set the root router this way. It is set on initialization';
    },
    get: function get$$1() {
      if (this.parent) return this.parent.root;
      return this;
    }
  }, {
    key: 'childTreeVisibilityOnHide',
    get: function get$$1() {
      return this.root._childTreeVisibilityOnHide[this.routeKey];
    },
    set: function set$$1(childVisiblity) {
      this.root._childTreeVisibilityOnHide[this.routeKey] = childVisiblity;
    }
  }, {
    key: 'mutateLocationOnSceneUpdate',
    get: function get$$1() {
      return this.root._mutateLocationOnSceneUpdate;
    },
    set: function set$$1(shouldMutate) {
      this.root._mutateLocationOnSceneUpdate = shouldMutate;
    }
  }, {
    key: 'mutateLocationOnStackUpdate',
    get: function get$$1() {
      return this.root._mutateLocationOnStackUpdate;
    },
    set: function set$$1(shouldMutate) {
      this.root._mutateLocationOnStackUpdate = shouldMutate;
    }
  }, {
    key: 'mutateLocationOnDataUpdate',
    get: function get$$1() {
      return this.root._mutateLocationOnDataUpdate;
    },
    set: function set$$1(shouldMutate) {
      this.root._mutateLocationOnDataUpdate = shouldMutate;
    }
  }, {
    key: 'mutateLocationOnFeatureUpdate',
    get: function get$$1() {
      return this.root._mutateLocationOnFeatureUpdate;
    },
    set: function set$$1(shouldMutate) {
      this.root._mutateLocationOnFeatureUpdate = shouldMutate;
    }
  }, {
    key: 'parent',
    get: function get$$1() {
      return this._parent;
    },
    set: function set$$1(parentRouter) {
      this._parent = parentRouter;
    }
  }, {
    key: 'type',
    get: function get$$1() {
      return this._type;
    },
    set: function set$$1(routerType) {
      this._type = routerType;
    }
  }, {
    key: 'routers',
    get: function get$$1() {
      return this._routers;
    },
    set: function set$$1() {
      var _this2 = this;

      var routers = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      this._routers = _extends({}, this.routers, routers);

      var routerTypes = Object.keys(this.routers);
      routerTypes.forEach(function (type) {
        _this2.routers[type].forEach(function (r) {
          r.parent = _this2; // eslint-disable-line no-param-reassign
          r.type = type; // eslint-disable-line no-param-reassign
        });
      });
    }

    /**
     * Determines if the curent router is a path router.
     * A path router stores information in the pathname rather than the search part of location
     *
     * By default scenes will be path routers if all their parents are also path routers.
     * A data router can explicitly be set (in the config) to be a pathrouter. This is useful
     * when you want to store information such as pages or ids. Ex: /user/:id
     */

  }, {
    key: 'isPathRouter',
    get: function get$$1() {
      // if there is no parent, we are at the root. The root is by default a path router since
      // it represents the '/' in a pathname location
      if (!this.parent) return true;
      // if this router was explicitly set to be a path router during config, return true
      if (this._isPathRouter && this.parent.isPathRouter) {
        return true;
      }
      // else if this router is a path router but its parent isn't we need to throw an error.
      // it is impossible to construct a path if all the parents are also not path routers
      if (this._isPathRouter) {
        throw this.type + ' router: ' + this.name + ' is explicitly set to modify the pathname\n        but one of its parent routers doesnt have this permission.\n        Make sure all parents have \'isPathRouter\' attribute set to \'true\' in the router config OR\n        Make sure all parents are of router type \'scene\' or \'data\'.\n        If the routers parents have siblings of both \'scene\' and \'data\' the \'scene\' router will always be used for the pathname\n      ';
      }

      if (this.type === 'scene' && this.parent.isPathRouter) {
        // check to make sure sibling data routers arent explicitly set to modify the pathname
        var siblingRouters = this.parent.routers.data || [];
        var isSiblingRouterExplictlyAPathRouter = siblingRouters.reduce(function (acc, r) {
          return (
            // check all data router siblings and
            // make sure none have been explicitly set to be a path router
            acc || r._isPathRouter === true
          );
        }, false);

        if (isSiblingRouterExplictlyAPathRouter === false) return true;
      } else if (this.type === 'data' && this.parent && this.parent.isPathRouter) {
        if (this._isPathRouter === false) return false;
        // check to make sure sibling scene routers aren't present
        var _siblingRouters = this.parent.routers.scene || [];

        if (_siblingRouters.length === 0) return true;
      }

      return false;
    }

    /**
    * The routerLevel corresponds to how many routers away the current router is from the root router
    */

  }, {
    key: 'routerLevel',
    get: function get$$1() {
      if (!this.parent) return 0;
      return 1 + this.parent.routerLevel;
    }
  }], [{
    key: 'updateLocationFnShow',
    value: function updateLocationFnShow(newLocation, router, ctx) {
      if (router.routeKey === ctx.originRouteKey) {
        return router.show(false, newLocation);
      }
      if (router.isDescendentOf(ctx.originRouteKey)) {
        if (router._rehydrateChildRoutersState !== false && (router._rehydrateChildRoutersState || ctx.rehydrateChildRoutersState)) {
          return router.rollBackToMostRecentState(newLocation, router, ctx);
        }
        // if (router.hasDefault) { // TODO Enable me once defaults code is added
        //   return router.useDefault(newLocation);
        // }
      }
      return newLocation;
    }
  }, {
    key: 'updateLocationFnHide',
    value: function updateLocationFnHide(location, router) {
      var locationToUseOnChild = { pathname: location.pathname, search: location.search, options: location.options };
      var updatedLocation = router.hide(false, locationToUseOnChild);

      var existingSearch = _typeof(location.search) === 'object' ? location.search : {};
      return { pathname: updatedLocation.pathname, search: _extends({}, existingSearch, updatedLocation.search), options: location.options };
    }
  }, {
    key: 'getChildTreeVisibility',
    value: function getChildTreeVisibility(router) {
      var childRouterTypes = Object.keys(router.routers);
      return childRouterTypes.reduce(function (acc, type) {
        router.routers[type].forEach(function (childRouter) {
          if (childRouter.visible && childRouter.type === 'scene' && childRouter.isPathRouter) {
            acc[childRouter.routeKey] = childRouter.routeKey;
          } else if (childRouter.visible && childRouter.type === 'stack') {
            acc[childRouter.routeKey] = childRouter.order;
          } else {
            acc[childRouter.routeKey] = childRouter.visible;
          }
        });
        return acc;
      }, {});
    }

    // fold a fn over a node and all its child nodes

  }, {
    key: 'reduceStateTree',
    value: function reduceStateTree(location, router, fn, ctx) {
      var _this3 = this;

      var newLocation = fn(location, router, ctx);
      var childRouterTypes = Object.keys(router.routers);

      return childRouterTypes.reduce(function (locationA, type) {
        return router.routers[type].reduce(function (locationB, childRouter) {
          var newCtx = _extends({}, ctx, { rehydrateChildRoutersState: childRouter._rehydrateChildRoutersState || ctx.rehydrateChildRoutersState });
          return _this3.reduceStateTree(locationB, childRouter, fn, newCtx);
        }, locationA);
      }, newLocation);
    }

    // all routers implement this method

  }]);
  return Router;
}(), (_descriptor = _applyDecoratedDescriptor(_class.prototype, '_state', [observable], {
  enumerable: true,
  initializer: function initializer() {
    return {
      at: undefined,
      from: undefined,
      data: undefined,
      visible: false,
      order: undefined
    };
  }
}), _applyDecoratedDescriptor(_class.prototype, 'state', [computed], Object.getOwnPropertyDescriptor(_class.prototype, 'state'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'visible', [computed], Object.getOwnPropertyDescriptor(_class.prototype, 'visible'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'order', [computed], Object.getOwnPropertyDescriptor(_class.prototype, 'order'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'history', [computed], Object.getOwnPropertyDescriptor(_class.prototype, 'history'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'data', [computed], Object.getOwnPropertyDescriptor(_class.prototype, 'data'), _class.prototype)), _class);


var initalizeRouter$1 = initalizeRouter(Router);

export default Router;
export { initalizeRouter$1 as initalizeRouter, registerRouter$$1 as registerRouter };
