/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: [
    '<rootDir>/jestSetup.js',
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation)/)',
  ],
  moduleNameMapper: {
    '^react-native$': '<rootDir>/__mocks__/react-native',
    '^react-native/Libraries/Network/XHRInterceptor$': '<rootDir>/__mocks__/react-native/Libraries/Network/XHRInterceptor.js',
    '^react-native/Libraries/Blob/FileReader$': '<rootDir>/__mocks__/react-native/Libraries/Blob/FileReader.js',
  },
};