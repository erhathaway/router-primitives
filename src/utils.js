import {
  types,
  getRoot,
  clone,
} from 'mobx-state-tree';

import queryString from 'query-string';

/* ------------------------ */
/* CONSTANTS */
/* ------------------------ */
const SWITCH_NAME = 'page'; // used in the query to reference this data: <self.routeKey>page ex: docpage
// const SWITCH_METHOD_SUFFIX = 'Page'; // prefix is 'navTo', ex: switchTo<Name>Page()` such as `switchToExplorePage()`

const STACK_NAME = '@'; // used in the query to reference this data: <self.routeKey>modal ex: intromodal
const STACK_METHOD_SUFFIX = 'Modal'; // prefixes are 'open' and 'close', ex: `open<Name>Modal()` such as `openViewModal()`

const FEATURE_NAME = '$'; // used in the query to reference this data <self.routeKey>show ex: viewshow
const FEATURE_METHOD_SUFFIX = 'Feature'; // prefixes are 'show' and 'hide' - ex: `show<Name>Feature()` such as `showLibraryFeature()`

const PAGE_NAME = '^'; // used in the query string to reference this data <self.routeKey>page ex: docpage


/* ------------------------ */
/* UPDATE ADDRESS STRING
/* ------------------------ */
const updateLocation = ({ pathname, search, state }, routerHistory, self) => {
  if (window && window.history) {
    const url = `${pathname}?${search}`;
    window.history.pushState(state, 'Cell AF', url)
  }
  getRoot(self).updateLocation({ pathname, search, state })
  // routerHistory.push({ pathname, search, state });
}

/* ------------------------ */
/* STATE EXTRACTION FROM Location OBJ (react-router lib)*/
/* ------------------------ */
const extractScene = (location, routeKey) => {
  const path = location.pathname;
  const splitPath = path.split('/');

  if (routeKey === '' || !routeKey) {
    return splitPath[1];
  }

  const index = splitPath.findIndex(p => p === routeKey);
  if (index) {
    const thisPath = splitPath[index + 1];
    return thisPath;
  }
  return undefined;
};

const extractModal = (location, routeKey) => {
  const parsedQuery = queryString.parse(location.search, { decode: true, arrayFormat: 'bracket' });
  return parsedQuery[`${routeKey}${STACK_NAME}`];
};

const extractFeatures = (location, routeKey) => {
  const parsedQuery = queryString.parse(location.search, { decode: true, arrayFormat: 'bracket' });
  return parsedQuery[`${routeKey}${FEATURE_NAME}`];
};

const extractPage = (location, routeKey) => {
  const parsedQuery = queryString.parse(location.search, { decode: true, arrayFormat: 'bracket' });
  return parsedQuery[`${routeKey}${PAGE_NAME}`];
};
/* ------------------------ */
/* Query String Manipulation */
/* ------------------------ */
// removes all items associated with a key in the query string
const removeFromQueryString = (existingQueryString, keysToRemove) => {
  const parsedQuery = queryString.parse(existingQueryString, { decode: true, arrayFormat: 'bracket' });
  keysToRemove.forEach(k => {
    delete parsedQuery[k];
  });
  return queryString.stringify(parsedQuery, { arrayFormat: 'bracket' });
}

// itemsToAdd is in the form { key: <queryString field name>, value: <Array of values to add under the name> }
const addArrayToQueryString = (existingQueryString, itemsToAdd) => {
  const parsedQuery = queryString.parse(existingQueryString, { decode: true, arrayFormat: 'bracket' });

  let newQuery;
  if (Array.isArray(itemsToAdd.value)) {
    let existingItems = parsedQuery[itemsToAdd.name] || [];
    // coerce to string if somehow its not there (legacy cache)
    if (typeof existingItems === 'string') {
      existingItems = [existingItems];
    }

    // filter out existing item so its stack position can be increased;

    itemsToAdd.value.forEach((i) => {
      existingItems = existingItems.filter(n => n !== i);
      existingItems.push(i);
    });

    newQuery = { ...parsedQuery, [itemsToAdd.name]: existingItems };
    return queryString.stringify(newQuery, { arrayFormat: 'bracket' });
  }
};

// itemsToRemove is in the form { name: <queryString field name>, value: <Array of values to add under the name> }
const removeArrayItemFromQueryString = (existingQueryString, itemsToRemove) => {
  const parsedQuery = queryString.parse(existingQueryString, { decode: true, arrayFormat: 'bracket' });

  let newQuery;
  if (Array.isArray(itemsToRemove.value)) {
    let existingItems = parsedQuery[itemsToRemove.name] || [];
    if (typeof existingItems === 'string') {
      existingItems = [existingItems];
    }
    const filteredItems = existingItems.filter(n => !itemsToRemove.value.includes(n));
    newQuery = { ...parsedQuery, [itemsToRemove.name]: filteredItems };
    return queryString.stringify(newQuery, { arrayFormat: 'bracket' });
  }
};

// objsToAdd is a bunch of key value pairs meant to be directly added to the query string
const addObjQueryString = (existingQueryString, objsToAdd) => {
  const parsedQuery = queryString.parse(existingQueryString, { decode: true, arrayFormat: 'bracket' });
  const newQuery = { ...parsedQuery, ...objsToAdd };
  return queryString.stringify(newQuery, { arrayFormat: 'bracket' });
};

/* ------------------------ */
/* METHODS GENERATION */
/* ------------------------ */
const dynamicallyGenerateNavToPathMethods = (self) => {
  if (!self.scenes) return {};

  return self.scenes.reduce((acc, { name }) => {
    // remove forward slashes
    const withoutSlash = name.replace(/\//g, '');
    // uppercase first letter
    const formattedName = withoutSlash !== '' ? (withoutSlash.charAt(0).toUpperCase() + withoutSlash.slice(1)) : 'Home';

    // generate method
    const fnObj = { [`navTo${formattedName}`](history) {
      const cleanSearch = removeFromQueryString(history.location.search, [`${self.routeKey}${STACK_NAME}`, `${self.routeKey}${FEATURE_NAME}`]); // modals are shown via the 'modal' field in the query string
      updateLocation({ pathname: name, search: cleanSearch, state: history.location.state }, history, self);
    },
    };
    return { ...fnObj, ...acc };
  }, {});
};

const dynamicallyGenerateToggleModalMethods = (self) => {
  if (!self.stack) return {};

  return self.stack.reduce((acc, { name }) => {

    // remove forward slashes
    const withoutSlash = name.replace(/\//g, '');
    // uppercase first letter
    const formattedName = withoutSlash.charAt(0).toUpperCase() + withoutSlash.slice(1);

    // generate methods
    const openFnObj = { [`open${formattedName}${STACK_METHOD_SUFFIX}`](history) {
      // const cleanSearch = removeFromQueryString(history.location.search, [`${self.routeKey}${STACK_NAME}`]); // stack are shown via the 'modal' field in the query string
      const newSearch = addArrayToQueryString(history.location.search, { name: `${self.routeKey}${STACK_NAME}`, value: [name] }); // stack are shown via the 'modal' field in the query string as an array, and are indexed by order added
      updateLocation({ pathname: history.location.pathname, search: newSearch, state: history.location.state }, history, self);
    },
    };


    const closeFnObj = { [`close${formattedName}${STACK_METHOD_SUFFIX}`](history) {
      const cleanSearch = removeArrayItemFromQueryString(history.location.search, { name: `${self.routeKey}${STACK_NAME}`, value: [name] }); // stack are shown via the 'modal' field in the query string
      updateLocation({ pathname: history.location.pathname, search: cleanSearch, state: history.location.state }, history, self);
    },
    };
    return { ...openFnObj, ...closeFnObj, ...acc };
  }, {});
};

const dynamicallyGenerateToggleVisibleFeaturesMethods = (self) => {
  if (!self.features) return {};

  return self.features.reduce((acc, { name }) => {

    // uppercase first letter
    const formattedName = name.charAt(0).toUpperCase() + name.slice(1);

    // generate methods
    const addfnObj = { [`show${formattedName}${FEATURE_METHOD_SUFFIX}`](history) {
      const newSearch = addArrayToQueryString(history.location.search, { name: `${self.routeKey}${FEATURE_NAME}`, value: [name] }); // features are shown via the 'FEATURE_NAME' field in the query string
      updateLocation({ pathname: history.location.pathname, search: newSearch, state: history.location.state }, history, self);
      },
    };

    const removeFnObj = { [`hide${formattedName}${FEATURE_METHOD_SUFFIX}`](history) {
      const newSearch = removeArrayItemFromQueryString(history.location.search, [`${self.routeKey}${FEATURE_NAME}`]);
      updateLocation({ pathname: history.location.pathname, search: newSearch, state: history.location.state }, history, self);
      },
    };

    return { ...addfnObj, ...removeFnObj, ...acc };
  }, {});
};

const dynamicallyGeneratePageNavMethods = (self) => {
  if (!self.pages) return {};

  // generate methods
  const navFnObj = { navToPage(history, id) {
    const newSearch = addObjQueryString(history.location.search, { [`${self.routeKey}${PAGE_NAME}`]: id }); // features are shown via the 'FEATURE_NAME' field in the query string
    updateLocation({ pathname: history.location.pathname, search: newSearch, state: history.location.state }, history, self);
    },
  };

  return navFnObj;
};

export {
  dynamicallyGenerateNavToPathMethods,
  dynamicallyGenerateToggleModalMethods,
  dynamicallyGenerateToggleVisibleFeaturesMethods,
  dynamicallyGeneratePageNavMethods,
  extractScene,
  extractFeatures,
  extractModal,
  extractPage,
};
