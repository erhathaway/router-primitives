module.exports = {
  testEnvironment: 'node',
  roots: [
    '<rootDir>',
  ],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  testMatch: ['**/__tests__/**/*.ts?(x)','**/?(*.)+(spec|test).ts?(x)'],
  moduleFileExtensions: [
    'ts',
    'tsx',
    'js',
    'jsx',
    'json',
    'node',
  ],
  globals: {
    'ts-jest': {
      diagnostics: {
        ignoreCodes: [7018, 2740, 2339],
      },
    },
  },
};
