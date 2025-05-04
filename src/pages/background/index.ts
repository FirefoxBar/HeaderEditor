import createApiHandler from './api-handler';
import { createDNRHandler } from './request-handler/dnr-handler';
import { createWebRequestHandler } from './request-handler/web-request-handler';
import './upgrade';

function init() {
  // 开始初始化
  createApiHandler();
  if (ENABLE_WEB_REQUEST) {
    createWebRequestHandler();
  }
  if (ENABLE_DNR) {
    createDNRHandler();
  }
}

if (MANIFEST_VER === 'v3') {
  // this is service worker
  addEventListener('activate', () => {
    init();
  });
} else {
  window.IS_BACKGROUND = true;
  init();
}
