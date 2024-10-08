import { createModel } from '@rematch/core';

import { Manifest } from '@verdaccio/types';

import type { RootModel } from '.';
import API from '../api';
import { APIRoute } from './routes';
import { stripTrailingSlash } from './utils';

/**
 *
 * @category Model
 */
export const packages = createModel<RootModel>()({
  state: {
    response: [] as Manifest[],
  },
  reducers: {
    savePackages(state, response: Manifest[]) {
      return {
        ...state,
        response,
      };
    },
  },
  effects: (dispatch) => ({
    async getPackages(_payload, state) {
      // console.log(`package number before: ${state.packages.response.length}`);
      const basePath = stripTrailingSlash(state.configuration.config.base);
      try {
        const payload: Manifest[] = await API.request(`${basePath}${APIRoute.PACKAGES}`);
        dispatch.packages.savePackages(payload);
        // console.log(`package number after: ${payload.length}`);
      } catch (error: any) {
        // eslint-disable-next-line no-console
        console.error({
          title: 'Warning',
          message: `Unable to load package list: ${error.message}`,
        });
        // TODO: handle error, display something retry or something
      }
    },
  }),
});
