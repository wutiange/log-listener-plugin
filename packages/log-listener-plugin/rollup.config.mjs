import { createConfig } from '../../rollup.config.base.mjs';
import packageJson from './package.json' assert { type: 'json' };

export default createConfig(packageJson, {
  external: [
    'react-native/Libraries/Network/XHRInterceptor',
    'react-native/Libraries/Blob/FileReader',
  ],
});
