import createApiHandler from './apiHandler';
import createLogHandler from './logHandler';
import createRequestHandler from './requestHandler';
import './upgrade';

if (typeof window !== 'undefined') {
  window.IS_BACKGROUND = true;
}

// 开始初始化
createLogHandler();
createApiHandler();
createRequestHandler();
