import browser from 'webextension-polyfill';
import logger from '@/share/core/logger';
import { APIs, TABLE_NAMES_ARR } from '@/share/core/constant';
import { prefs } from '@/share/core/prefs';
import emitter from '@/share/core/emitter';
import * as rules from './core/rules';
import { openURL } from './utils';
import { getDatabase } from './core/db';

function execute(request: any) {
  if (request.method === 'notifyBackground') {
    request.method = request.reason;
    delete request.reason;
  }
  switch (request.method) {
    case APIs.HEALTH_CHECK:
      return new Promise((resolve) => {
        getDatabase()
          .then(() => resolve(true))
          .catch(() => resolve(false));
      });
    case APIs.OPEN_URL:
      return openURL(request);
    case APIs.GET_RULES:
      return rules.waitLoad().then(() => rules.get(request.type, request.options));
    case APIs.SAVE_RULE:
      return rules.waitLoad().then(() => rules.save(request.rule));
    case APIs.DELETE_RULE:
      return rules.waitLoad().then(() => rules.remove(request.type, request.id));
    case APIs.SET_PREFS:
      return prefs.set(request.key, request.value);
    case APIs.UPDATE_CACHE:
      if (request.type === 'all') {
        return Promise.all(TABLE_NAMES_ARR.map((tableName) => rules.updateCache(tableName)));
      } else {
        return rules.updateCache(request.type);
      }
    default:
      break;
  }
  // return false;
}

function updateIcon(disabled: boolean) {
  if (MANIFEST_VER === 'v2') {
    browser.browserAction.setIcon({
      path: `/assets/images/128${disabled ? 'w' : ''}.png`,
    });
  } else {
    browser.action.setIcon({
      path: `/assets/images/128${disabled ? 'w' : ''}.png`,
    });
  }
}

export default function createApiHandler() {
  browser.runtime.onMessage.addListener((request) => {
    logger.debug('Background Receive Message', request);
    if (request.method === 'batchExecute') {
      const queue = request.batch.map((item) => {
        const res = execute(item);
        if (res) {
          return res;
        }
        return Promise.resolve();
      });
      return Promise.allSettled(queue);
    }
    return execute(request);
  });

  emitter.on(emitter.EVENT_PREFS_UPDATE, (key: string, val: any) => {
    switch (key) {
      case 'disable-all':
        updateIcon(val);
        break;
      default:
        break;
    }
  });

  prefs.ready(() => {
    const disableAll = Boolean(prefs.get('disable-all'));
    updateIcon(disableAll);
  });
}
