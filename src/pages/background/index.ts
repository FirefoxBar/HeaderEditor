import browser from 'webextension-polyfill';
import createApiHandler from './api-handler';
import { createDNRHandler } from './request-handler/dnr-handler';
import { createWebRequestHandler } from './request-handler/web-request-handler';
import './upgrade';

function init() {
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
}

if (ENABLE_DNR) {
  browser.runtime.onInstalled.addListener(async (details) => {
    if (details.reason === 'update') {
      browser.storage.session.remove('dnr_handler');
      const currentRules = await browser.declarativeNetRequest.getSessionRules();
      browser.declarativeNetRequest.updateSessionRules({
        removeRuleIds: currentRules.map((x) => x.id),
      });
    }
  });
}

if (MANIFEST_VER === 'v3' && typeof window === 'undefined') {
  // this is service worker
  addEventListener('activate', () => {
    if (IS_DEV) {
      console.log('service worker activated');
    }
    init();
  });
} else {
  window.IS_BACKGROUND = true;
  init();
}
