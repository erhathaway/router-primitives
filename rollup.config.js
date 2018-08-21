import babel from 'rollup-plugin-babel';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

const dependencies = Object.keys({
  ...require('./package.json').dependencies,
  ...require('./package.json').peerDependencies,
});
const include = 'query-string';
console.log(dependencies)
export default {
  input: 'src/index.js',
  output: {
    file: 'dist/index.js',
    format: 'cjs'
  },
  plugins: [
    resolve({
      // only: 'query-string'
      customResolveOptions: {
  moduleDirectory: 'node_modules'
}
    }),
    commonjs({
      include: 'node_modules/**'
    }),
    babel({
      babelrc: true,
    })
  ],
  external: dependencies.filter(d => d !== 'query-string'),
};
