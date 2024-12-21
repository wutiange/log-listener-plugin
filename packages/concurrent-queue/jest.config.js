const baseConfig = require('../../jest.config.js');
const packageJson = require('./package.json');

module.exports = {
  ...baseConfig,
  displayName: packageJson.name,
  testMatch: ['<rootDir>/**/*.test.{ts,tsx,js,jsx}'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  rootDir: './',
};
