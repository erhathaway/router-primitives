const dependencies = Object.keys(require('./package.json').dependencies);

export default {
  input: 'src/index.js',
  output: {
    file: 'dist/index.js',
    format: 'cjs'
  },
  external: dependencies
};
