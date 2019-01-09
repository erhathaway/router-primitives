import { decorate, computed, observable, autorun } from 'mobx';
import JSstringify from 'javascript-stringify';
import defaultConfig from './defaultConfig';
import beautify from 'js-beautify';
import { create, persist } from 'mobx-persist'

/**
 * model for capturing user input in the playground
 * and generating a router config object off of it
 */
class RouterConfigModel {
  input = '';
  config = { name: 'root' };
  error = '';

  constructor(params = {}) {
    console.log(JSstringify(defaultConfig))
    const beautifyOpts = {
      jslint_happy: true,
      eval_code: true
    };
    this.input = params.input || beautify(JSstringify(defaultConfig), beautifyOpts)
    this.config = params.config || defaultConfig;
  }
}

/**
 * create a mobx
 */
const RouterConfig = decorate(RouterConfigModel, {
  input: observable,
  config: observable,
})

const routerConfigInstance = new RouterConfig();

/**
 * evaluate the input into a valid config object
 */
autorun(() => {
  try {
    const code = eval(`(${routerConfigInstance.input})`);
    console.log('evaluating code', code)
    if (code !== null && typeof code === 'object') {
      routerConfigInstance.config = code;
      console.log('added code', code)
    }
  } catch(e) {
    console.log('error adding code', this.input)
    const { name } = e;
    routerConfigInstance.error = name ? name : '';
  }
}, true)

/**
 * adds persistance to mobx model
 */
 export const hydratedRouterConfigInstance = persist({ input: true })(routerConfigInstance);

 const hydrate = create({
    jsonify: false  // if you use AsyncStorage, here shoud be true
});

hydrate('some', hydratedRouterConfigInstance)
  .then(() => console.log('someStore has been hydrated'))


export default routerConfigInstance;
