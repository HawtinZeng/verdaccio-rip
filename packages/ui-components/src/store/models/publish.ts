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
      const basePath = stripTrailingSlash(state.configuration.config.base);
      try {
        return await API.request(basePath + `/${metadata.name}`, 'PUT', {
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(metadata),
        });
      } catch (error: any) {
        // eslint-disable-next-line no-console
        console.log('error: publishAct', error);
      }
    },
  }),
});
