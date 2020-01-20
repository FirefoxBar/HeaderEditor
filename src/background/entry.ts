import createApiHandler from './apiHandler';
import initHotLinkMenu from './hotLinkMenu';
import createRequestHandler from './requestHandler';

window.IS_BACKGROUND = true;

// 开始初始化
createApiHandler();
createRequestHandler();
initHotLinkMenu();
