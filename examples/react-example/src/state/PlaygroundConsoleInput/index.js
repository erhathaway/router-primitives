import { decorate, computed, observable, autorun } from 'mobx';
import JSstringify from 'javascript-stringify';
import defaultConfig from './defaultConfig';
import beautify from 'js-beautify';

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
      // .split('"routers:"').join('"routers":\n')
      // .split('"name":').join('\n"name":');
    this.code = params.code || defaultConfig;
  }
}

const RouterConfig = decorate(RouterConfigModel, {
  input: observable,
})

const routerConfigInstance = new RouterConfig();

autorun(() => {
  try {
    const code = eval(`(${routerConfigInstance.input})`);
    console.log('code eval', code)
    if (code !== null && typeof code === 'object') {
      routerConfigInstance.config = code;
      console.log('added code', code)
    }
  } catch(e) {
    console.log(this.input)
    const { name } = e;
    routerConfigInstance.error = name ? name : '';
  }
}, true)

export default routerConfigInstance;
