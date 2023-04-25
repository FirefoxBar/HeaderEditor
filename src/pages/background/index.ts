import createApiHandler from './api-handler';
import createRequestHandler from './request-handler';
import './upgrade';

if (typeof window !== 'undefined') {
  window.IS_BACKGROUND = true;
}

// 开始初始化
createApiHandler();
createRequestHandler();
