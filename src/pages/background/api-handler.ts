import browser from 'webextension-polyfill';
import logger from '@/share/core/logger';
import { APIs, TABLE_NAMES_ARR, TABLE_NAMES } from '@/share/core/constant';
import { prefs } from '@/share/core/prefs';
import rules from './core/rules';
import { openURL } from './utils';
import { getDatabase } from './core/db';


function execute(request: any) {
  if (request.method === 'notifyBackground') {
    request.method = request.reason;
    delete request.reason;
  }
  switch (request.method) {
    case APIs.HEALTH_CHECK:
      return new Promise((resolve) => {
        getDatabase()
          .then(() => resolve(true))
          .catch(() => resolve(false));
      });
    case APIs.OPEN_URL:
      return openURL(request);
    case APIs.GET_RULES:
      return Promise.resolve(rules.get(request.type, request.options));
    case APIs.SAVE_RULE:
      browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
        tabs.forEach((tab) => {
          if (tab.id) {
            console.log('[Header Editor] 向 content-script 发送消息', { tabId: tab.id, method: APIs.SAVE_RULE, rule: request.rule });
            browser.tabs.sendMessage(tab.id, { method: APIs.SAVE_RULE, rule: request.rule });
          }
        });
      });
      return rules.save(request.rule);
    case APIs.DELETE_RULE:
      return rules.remove(request.type, request.id);
    case APIs.SET_PREFS:
      browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
        tabs.forEach((tab) => {
          if (tab.id) {
            console.log('[Header Editor] 向 content-script 发送消息', { tabId: tab.id, method: APIs.SET_PREFS, key: request.key, value: request.value });
            browser.tabs.sendMessage(tab.id, { method: APIs.SET_PREFS, key: request.key, value: request.value });
          }
        });
      });
      return prefs.set(request.key, request.value);
    case APIs.UPDATE_CACHE:
      if (request.type === 'all') {
        return Promise.all(TABLE_NAMES_ARR.map((tableName) => rules.updateCache(tableName)));
      } else {
        return rules.updateCache(request.type);
      }
    default:
      break;
  }
  // return false;
}

const currentIP = {};

export default function createApiHandler() {
  // get IP using webRequest
  browser.webRequest.onCompleted.addListener(
    (info) => {
      const u = new URL(info.url);
      if (info.tabId in currentIP) {
        currentIP[info.tabId][u.hostname] = info.ip;
      } else {
        currentIP[info.tabId] = { [u.hostname]: info.ip };
      }
    },
    {
      urls: [],
      types: [],
    },
    [],
  );

  browser.runtime.onMessage.addListener((request: any, sender, sendResponse) => {
    if (request.method === 'GetData') {
      console.log('[Header Editor] 收到来自 content-script 的消息', { request, sender });
      const currentIPList: Array<{ domain: string; ip: string }> = [];
      const tabId = sender.tab?.id || 0;
      if (tabId in currentIP) {
        for (const key in currentIP[tabId]) {
          if (Object.prototype.hasOwnProperty.call(currentIP[tabId], key)) {
            currentIPList.push({ domain: key, ip: currentIP[tabId][key] });
          }
        }
      }

      const response = {
        rules: rules.get(TABLE_NAMES.sendHeader),
        enableRules: rules.get(TABLE_NAMES.sendHeader, { enable: true }),
        enable: !prefs.get('disable-all'),
        currentIPList,
      };

      console.log('[Header Editor] 返回 content-script 的数据', response);
      sendResponse(response);
    }

    logger.debug('Background Receive Message', request);
    if (request.method === 'batchExecute') {
      const queue = request.batch.map((item) => {
        const res = execute(item);
        if (res) {
          return res;
        }
        return Promise.resolve();
      });
      return Promise.allSettled(queue);
    }
    return execute(request);
  });
}
