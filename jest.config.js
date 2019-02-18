module.exports = {
  roots: [
    '<rootDir>',
  ],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
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
        ignoreCodes: [7018, 2740],
      },
    },
  },
};
