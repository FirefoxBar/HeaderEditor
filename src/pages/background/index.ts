import createApiHandler from './api-handler';
import { createChromeResponseModifier } from './request-handler/chrome-response-modifier';
import { createDNRHandler } from './request-handler/dnr-handler';
import { createWebRequestHandler } from './request-handler/web-request-handler';
import './upgrade';

let initd = false;
function init() {
  if (initd) {
    return;
  }
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
  if (BROWSER_TYPE === 'chrome') {
    createChromeResponseModifier();
  }
}

if (typeof window !== 'undefined') {
  window.IS_BACKGROUND = true;
}

// is chromium-like browser in v3 mode
if (MANIFEST_VER === 'v3' && typeof window === 'undefined') {
  chrome.runtime.onStartup.addListener(init);
}

init();
