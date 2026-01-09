import browser from 'webextension-polyfill';
import { getLocal } from '@/share/core/storage';
import { IS_CHROME } from '@/share/core/utils';
import createApiHandler from './api-handler';
import { init as initRules } from './core/rules';
import { createChromeResponseModifier } from './request-handler/chrome-response-modifier';
import { createDNRHandler } from './request-handler/dnr-handler';
import { createWebRequestHandler } from './request-handler/web-request-handler';
import { init as initTasks } from './tasks';
import { doUpgrade } from './upgrade';

let initd = false;
function init() {
  if (initd) {
    return;
  }
  doUpgrade();
  initRules();
  initTasks();
  initd = true;
  if (IS_DEV) {
    console.log('init:', ENABLE_WEB_REQUEST, ENABLE_DNR);
  }
  // 开始初始化
  createApiHandler();
  if (ENABLE_WEB_REQUEST) {
    createWebRequestHandler();
  }
  if (ENABLE_DNR) {
    createDNRHandler();
  }
  if (IS_CHROME) {
    createChromeResponseModifier();
  }

  // remove fake session storage
  if (
    typeof chrome !== 'undefined' &&
    !('session' in chrome.storage) &&
    'getKeys' in getLocal()
  ) {
    getLocal()
      .getKeys()
      .then(keys => {
        const removeKeys = keys.filter(key => key.startsWith('sess_'));
        if (removeKeys.length > 0) {
          getLocal().remove(removeKeys);
        }
      });
  }
}

if (typeof window !== 'undefined') {
  window.IS_BACKGROUND = true;
}

// is in v3 mode
if (MANIFEST_VER === 'v3') {
  try {
    browser.runtime.onStartup.addListener(init);
  } catch (_) {
    // ignore
  }
}

init();
