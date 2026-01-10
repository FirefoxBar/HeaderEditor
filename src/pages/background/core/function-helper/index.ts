import { nanoid } from 'nanoid';
import type { Storage } from 'webextension-polyfill';
import { getLastTaskRun, getTask, getValidTaskRun } from '../task';
import { lodash } from './lodash';

export const basicHelper = {
  _: lodash,
  nanoid,
  task: {
    get: getTask,
    getLastRun: getLastTaskRun,
    getValidRun: getValidTaskRun,
  },
};

export const createStorage = (name: string, storage: Storage.StorageArea) => {
  const getKey = (key: string) => `f#${name}#${key}`;

  return {
    async get(key: string) {
      const k = getKey(key);
      const data = await storage.get(k);
      return data[k];
    },
    set(key: string, value: any) {
      return storage.set({ [getKey(key)]: value });
    },
    remove(key: string) {
      return storage.remove(getKey(key));
    },
    async has(key: string) {
      const k = getKey(key);
      const data = await storage.get(k);
      return k in data;
    },
  };
};
