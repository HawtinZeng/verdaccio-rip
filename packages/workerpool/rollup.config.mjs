import typescript from '@rollup/plugin-typescript';
import webWorkerLoader from 'rollup-plugin-web-worker-loader';

import { startScript } from './rollupPlugins/startScript.mjs';

export default {
  input: 'src/index.ts',
  output: {
    dir: 'dist',
    format: 'cjs'
  },
  plugins: [
    startScript('cd playground && pnpm run start'),
    webWorkerLoader({ targetPlatform: 'browser' }),
    typescript()
  ],
  watch: {
    skipWrite: false,
    clearScreen: false,
    include: './src/**/*'
  }
};
