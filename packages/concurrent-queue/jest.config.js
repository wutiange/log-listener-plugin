const packageJson = require('./package.json');

module.exports = {
  displayName: packageJson.name,
  testEnvironment: 'node',
  testMatch: ['<rootDir>/**/*.test.{ts,tsx,js,jsx}'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  rootDir: './',
};
