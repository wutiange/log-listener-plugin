const baseConfig = require('../../jest.config.js');
const packageJson = require('./package.json');
/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  ...baseConfig,
  displayName: packageJson.name,
  setupFilesAfterEnv: ['<rootDir>/jestSetup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation)/)',
  ],
  moduleNameMapper: {
    '^react-native$': '<rootDir>/__mocks__/react-native',
    '^react-native/Libraries/Network/XHRInterceptor$':
      '<rootDir>/__mocks__/react-native/Libraries/Network/XHRInterceptor.js',
    '^react-native/Libraries/Blob/FileReader$':
      '<rootDir>/__mocks__/react-native/Libraries/Blob/FileReader.js',
  },
  roots: ['<rootDir>/src'],
};
