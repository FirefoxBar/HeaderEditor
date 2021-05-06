import createApiHandler from './apiHandler';
import initHotLinkMenu from './hotLinkMenu';
import createLogHandler from './logHandler';
import createRequestHandler from './requestHandler';

window.IS_BACKGROUND = true;

// 开始初始化
createLogHandler();
createApiHandler();
createRequestHandler();
initHotLinkMenu();
