import createApiHandler from './api-handler';
import { createDNRHandler } from './request-handler/dnr-handler';
import { createWebRequestHandler } from './request-handler/web-request-handler';
import './upgrade';

if (typeof window !== 'undefined') {
  window.IS_BACKGROUND = true;
}

// 开始初始化
createApiHandler();
if (ENABLE_WEB_REQUEST) {
  createWebRequestHandler();
}
if (ENABLE_DNR) {
  createDNRHandler();
}
