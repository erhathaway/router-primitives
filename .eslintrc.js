module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module'
    },
    env: {
        browser: true,
        node: true
    },
    plugins: ['@typescript-eslint', 'jest'],
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/eslint-recommended',
        'plugin:@typescript-eslint/recommended',
        'prettier/@typescript-eslint'
    ],
    rules: {
        'jest/no-disabled-tests': 'warn',
        'jest/no-focused-tests': 'error',
        'jest/no-identical-title': 'error',
        'jest/prefer-to-have-length': 'warn',
        'jest/valid-expect': 'error',
        '@typescript-eslint/explicit-function-return-type': [
            'error',
            {
                allowExpressions: true
            }
        ],
        '@typescript-eslint/no-unused-vars': ['error', {argsIgnorePattern: '^_'}],
        camelcase: 'off',
        '@typescript-eslint/interface-name-prefix': ['error', {prefixWithI: 'always'}],
        '@typescript-eslint/camelcase': ['error', {properties: 'always'}], // enfore camelcase for property names
        'sort-imports': 'off',
        // 'variable-name': [true, 'ban-keywords', 'check-format', 'allow-leading-underscore'],
        'max-classes-per-file': ['error', 3], // allow 3 class per file max
        'object-literal-sort-keys': 'off', // don't requre object keys to be sorted
        'arrow-parens': 'off', // don't require parens around arrow functions
        'object-curly-spacing': ['error', 'never'] // don't allow spacing inside brackets
    },
    settings: {}
};
