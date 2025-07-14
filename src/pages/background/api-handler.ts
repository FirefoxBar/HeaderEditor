import browser from 'webextension-polyfill';
import logger from '@/share/core/logger';
import { APIs, TABLE_NAMES_ARR, TABLE_NAMES } from '@/share/core/constant';
import { prefs } from '@/share/core/prefs';
import rules from './core/rules';
import { openURL } from './utils';
import { getDatabase } from './core/db';

// 获取全局规则处理器
function getRuleHandler() {
  return (globalThis as any).headerEditorRuleHandler;
}

function execute(request: any) {
  logger.debug('执行 API 请求:', request);

  if (request.method === 'notifyBackground') {
    request.method = request.reason;
    delete request.reason;
  }

  switch (request.method) {
    case APIs.HEALTH_CHECK:
      return new Promise((resolve) => {
        getDatabase()
          .then(() => {
            logger.debug('健康检查通过');
            resolve(true);
          })
          .catch((error) => {
            logger.error('健康检查失败:', error);
            resolve(false);
          });
      });

    case APIs.OPEN_URL:
      logger.debug('打开URL:', request.url);
      return openURL(request);

    case APIs.GET_RULES: {
      logger.debug('获取规则:', { type: request.type, options: request.options });
      const rulesResult = rules.get(request.type, request.options);
      logger.debug('规则查询结果:', rulesResult?.length || 0, '条规则');
      return Promise.resolve(rulesResult);
    }

    case APIs.SAVE_RULE:
      logger.debug('保存规则:', request.rule);

      // 通知活动标签页
      browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
        tabs.forEach((tab) => {
          if (tab.id) {
            logger.debug('向 content-script 发送保存规则消息', { tabId: tab.id, rule: request.rule });
            browser.tabs.sendMessage(tab.id, { method: APIs.SAVE_RULE, rule: request.rule });
          }
        });
      });

      // 保存规则并刷新 V3 规则
      return rules.save(request.rule).then((result) => {
        logger.info('规则保存成功:', result);

        // 触发 V3 规则刷新
        const ruleHandler = getRuleHandler();
        if (ruleHandler) {
          logger.debug('触发 V3 规则刷新（保存规则后）');
          ruleHandler.refresh().catch((error: any) => {
            logger.error('V3 规则刷新失败:', error);
          });
        } else {
          logger.warn('规则处理器未找到，无法刷新 V3 规则');
        }

        return result;
      }).catch((error) => {
        logger.error('保存规则失败:', error);
        throw error;
      });

    case APIs.DELETE_RULE:
      logger.debug('删除规则:', { type: request.type, id: request.id });

      return rules.remove(request.type, request.id).then((result) => {
        logger.info('规则删除成功:', { type: request.type, id: request.id });

        // 触发 V3 规则刷新
        const ruleHandler = getRuleHandler();
        if (ruleHandler) {
          logger.debug('触发 V3 规则刷新（删除规则后）');
          ruleHandler.refresh().catch((error: any) => {
            logger.error('V3 规则刷新失败:', error);
          });
        } else {
          logger.warn('规则处理器未找到，无法刷新 V3 规则');
        }

        return result;
      }).catch((error) => {
        logger.error('删除规则失败:', error);
        throw error;
      });

    case APIs.SET_PREFS:
      logger.debug('设置偏好:', { key: request.key, value: request.value });

      // 通知活动标签页
      browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
        tabs.forEach((tab) => {
          if (tab.id) {
            logger.debug('向 content-script 发送偏好设置消息', { tabId: tab.id, key: request.key, value: request.value });
            browser.tabs.sendMessage(tab.id, { method: APIs.SET_PREFS, key: request.key, value: request.value });
          }
        });
      });

      return prefs.set(request.key, request.value).then((result) => {
        logger.info('偏好设置成功:', { key: request.key, value: request.value });

        // 如果是禁用/启用扩展，触发 V3 规则刷新
        if (request.key === 'disable-all') {
          const ruleHandler = getRuleHandler();
          if (ruleHandler) {
            logger.debug('触发 V3 规则刷新（偏好设置变化）');
            ruleHandler.refresh().catch((error: any) => {
              logger.error('V3 规则刷新失败:', error);
            });
          }
        }

        return result;
      }).catch((error) => {
        logger.error('设置偏好失败:', error);
        throw error;
      });

    case APIs.UPDATE_CACHE:
      logger.debug('更新缓存:', request.type);

      if (request.type === 'all') {
        return Promise.all(TABLE_NAMES_ARR.map((tableName) => {
          logger.debug('更新表缓存:', tableName);
          return rules.updateCache(tableName);
        })).then((results) => {
          logger.info('所有表缓存更新完成');

          // 触发 V3 规则刷新
          const ruleHandler = getRuleHandler();
          if (ruleHandler) {
            logger.debug('触发 V3 规则刷新（缓存更新后）');
            ruleHandler.refresh().catch((error: any) => {
              logger.error('V3 规则刷新失败:', error);
            });
          }

          return results;
        });
      } else {
        return rules.updateCache(request.type).then((result) => {
          logger.info('表缓存更新完成:', request.type);

          // 触发 V3 规则刷新
          const ruleHandler = getRuleHandler();
          if (ruleHandler) {
            logger.debug('触发 V3 规则刷新（缓存更新后）');
            ruleHandler.refresh().catch((error: any) => {
              logger.error('V3 规则刷新失败:', error);
            });
          }

          return result;
        });
      }

    default:
      logger.warn('未知的 API 方法:', request.method);
      break;
  }
  // return false;
}

export default function createApiHandler() {
  logger.info('创建 API 处理器');

  browser.runtime.onMessage.addListener((request: any, sender, sendResponse) => {
    if (request.method === 'GetData') {
      logger.debug('收到来自 content-script 的 GetData 请求', { request, sender });

      const response = {
        rules: rules.get(TABLE_NAMES.sendHeader),
        enableRules: rules.get(TABLE_NAMES.sendHeader, { enable: true }),
        enable: !prefs.get('disable-all'),
        currentIPList: [], // V3 中无法获取IP信息
      };

      logger.debug('返回 content-script 的数据', {
        rulesCount: response.rules?.length || 0,
        enableRulesCount: response.enableRules?.length || 0,
        enable: response.enable,
      });

      sendResponse(response);
      return;
    }

    logger.debug('Background 收到消息', request);

    if (request.method === 'batchExecute') {
      logger.debug('执行批量操作:', request.batch?.length || 0, '个操作');

      const queue = request.batch.map((item: any) => {
        const res = execute(item);
        if (res) {
          return res;
        }
        return Promise.resolve();
      });

      return Promise.allSettled(queue).then((results) => {
        logger.debug('批量操作完成:', results.length, '个结果');
        return results;
      });
    }

    const result = execute(request);
    if (result && typeof result.then === 'function') {
      result.catch((error) => {
        logger.error('API 执行失败:', error);
      });
    }

    return result;
  });
}
