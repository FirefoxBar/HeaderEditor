import logger from '@/share/core/logger';
import rules from '@/share/core/rules';
import { getDatabase, prefs } from '@/share/core/storage';
import { APIs } from '@/share/core/var';
import { browser } from 'webextension-polyfill-ts';
import { openURL } from './utils';

export default function createApiHandler() {
  browser.runtime.onMessage.addListener((request, sender) => {
    if (request.method === 'notifyBackground') {
      request.method = request.reason;
    }
    logger.d('Background Receive Message', request);
    switch (request.method) {
      case APIs.HEALTH_CHECK:
        return new Promise(resolve => {
          getDatabase()
            .then(() => resolve(true))
            .catch(() => resolve(false));
        });
      case APIs.OPEN_URL:
        return openURL(request);
      case APIs.GET_RULES:
        return Promise.resolve(rules.get(request.type, request.options));
      case APIs.SAVE_RULE:
        return rules.save(request.rule);
      case APIs.DELETE_RULE:
        return rules.remove(request.type, request.id);
      case APIs.SET_PREFS:
        return prefs.set(request.key, request.value);
      case APIs.UPDATE_CACHE:
        if (request.type === 'all') {
          return Promise.all([
            rules.updateCache('request'),
            rules.updateCache('sendHeader'),
            rules.updateCache('receiveHeader'),
            rules.updateCache('receiveBody'),
          ]);
        } else {
          return rules.updateCache(request.type);
        }
    }
  });
}
