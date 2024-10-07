import { createModel } from '@rematch/core';

import type { RootModel } from '.';
import API from '../api';
import { stripTrailingSlash } from './utils';

/**
 *
 * @category Model
 */
export const publish = createModel<RootModel>()({
  state: {},
  reducers: {},
  effects: () => ({
    async publishAct(metadata, state) {
      // For build env
      const basePath = stripTrailingSlash(state.configuration.config.base);
      // For local dev env
      // const basePath = 'http://localhost:8000';
      try {
        return await API.request(basePath + `/${metadata.name}`, 'PUT', {
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(metadata),
        });
      } catch (error: any) {
        // eslint-disable-next-line no-console
        console.error('error on download', error);
      }
    },
  }),
});
