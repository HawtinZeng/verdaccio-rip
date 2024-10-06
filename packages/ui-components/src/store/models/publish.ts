import { createModel } from '@rematch/core';

import type { RootModel } from '.';
import API from '../api';

/**
 *
 * @category Model
 */
export const publish = createModel<RootModel>()({
  state: {},
  reducers: {},
  effects: () => ({
    async publishAct(metadata) {
      const basePath = 'http://localhost:8000';
      try {
        await API.request(basePath + `/${metadata.name}`, 'PUT', {
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
