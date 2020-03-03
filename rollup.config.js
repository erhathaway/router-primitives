import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import typescript from 'rollup-plugin-typescript2';
import pkg from './package.json';
import {eslint} from 'rollup-plugin-eslint';

const dependencies = Object.keys({
    ...pkg.dependencies,
    ...pkg.peerDependencies
});

export default {
    input: 'src/index.ts',
    output: [
        {
            file: pkg.main,
            format: 'cjs'
        },
        {
            file: pkg.module,
            format: 'es'
        }
    ],
    plugins: [
        eslint({throwOnError: true}),
        typescript({
            typescript: require('typescript')
        }),
        resolve({
            customResolveOptions: {
                moduleDirectory: 'node_modules'
            }
        }),
        commonjs({
            include: 'node_modules/**'
        })
    ],
    external: dependencies.filter(d => d !== 'query-string')
};
