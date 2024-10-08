const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const path = require('path');

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  watchFolders: [path.resolve(__dirname, '..')],
  resolver: {
    extraNodeModules: {
      '@wutiange/log-listener-plugin': path.resolve(__dirname, '..'),
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
