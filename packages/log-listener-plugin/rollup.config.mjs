import { createConfig } from '../../rollup.config.base.mjs';
import { readFileSync } from 'fs';

const packageJson = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url)),
);

export default createConfig(packageJson, {
  external: [
    'react-native/Libraries/Blob/FileReader',
    'react-native/Libraries/Utilities/createPerformanceLogger',
    'react-native/Libraries/vendor/emitter/EventEmitter',
    'react-native/Libraries/Blob/BlobManager',
    'react-native/Libraries/Utilities/GlobalPerformanceLogger',
    'react-native/Libraries/Network/RCTNetworking',
  ],
});
