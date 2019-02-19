import babel from 'rollup-plugin-babel';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import typescript from 'rollup-plugin-typescript2';
import tslint from "rollup-plugin-tslint";
import pkg from './package.json';

const dependencies = Object.keys({
  ...require('./package.json').dependencies,
  ...require('./package.json').peerDependencies,
});

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
    tslint({}),
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
  ],
  external: dependencies.filter(d => d !== 'query-string'),
};
