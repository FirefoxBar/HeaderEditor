import browser from 'webextension-polyfill';
import { IS_CHROME } from '@/share/core/utils';
import createApiHandler from './api-handler';
import { init as initRules } from './core/rules';
import { createChromeResponseModifier } from './request-handler/chrome-response-modifier';
import { createDNRHandler } from './request-handler/dnr-handler';
import { createWebRequestHandler } from './request-handler/web-request-handler';
import { doUpgrade } from './upgrade';

let initd = false;
function init() {
  if (initd) {
    return;
  }
  doUpgrade();
  initRules();
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
}

if (typeof window !== 'undefined') {
  window.IS_BACKGROUND = true;
}

// is in v3 mode
if (MANIFEST_VER === 'v3') {
  try {
    browser.runtime.onStartup.addListener(init);
  } catch (e) {
    // ignore
  }
}

init();
