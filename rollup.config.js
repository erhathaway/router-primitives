import babel from 'rollup-plugin-babel';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import { eslint } from 'rollup-plugin-eslint';
import minify from 'rollup-plugin-babel-minify';
import typescript from 'rollup-plugin-typescript2';
import pkg from './package.json';

const dependencies = Object.keys({
  ...require('./package.json').dependencies,
  ...require('./package.json').peerDependencies,
});

const include = 'query-string';

export default {
  input: 'src/index.ts',
  output: [
    {
      file: pkg.main,
      format: 'cjs',
    },
    {
      file: pkg.module,
      format: 'es',
    },
  ],
  plugins: [
    eslint({}),
    typescript({
      typescript: require('typescript'),
    }),
    resolve({
      customResolveOptions: {
        moduleDirectory: 'node_modules',
      },
    }),
    commonjs({
      include: 'node_modules/**',
    }),
    babel({
      babelrc: true,
    }),
    // minify({
    //   comments: false,
    //   sourceMap: false,
    // }),
  ],
  external: dependencies.filter(d => d !== 'query-string'),
};
