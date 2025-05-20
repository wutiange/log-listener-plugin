import { createConfig } from '../../rollup.config.base.mjs';
import { readFileSync } from 'fs';

const packageJson = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url)),
);

export default createConfig(packageJson, {
  external: [
    'react-native/Libraries/Network/XHRInterceptor',
    'react-native/Libraries/Blob/FileReader',
  ],
});
