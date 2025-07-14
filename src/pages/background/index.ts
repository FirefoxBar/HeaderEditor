// Header Editor Manifest V3 背景脚本
// 导入必要的模块
import { prefs } from '@/share/core/prefs';
import { TABLE_NAMES_ARR, TABLE_NAMES, EVENTs, RULE_TYPE, RULE_MATCH_TYPE } from '@/share/core/constant';
import logger from '@/share/core/logger';
import notify from '@/share/core/notify';
import createApiHandler from './api-handler';
import { V3RuleConverter } from './v3-rule-converter';
import rules from './core/rules';

console.log('Header Editor Service Worker 启动');

// 设置全局标识
if (typeof globalThis !== 'undefined') {
  globalThis.IS_BACKGROUND = true;
}

// 规则处理器
class V3RuleHandler {
  private conversionStats: any = null;
  private isInitialized = false;

  async initialize(): Promise<void> {
    console.log('初始化 V3 规则处理器...');

    // 等待偏好设置准备完成
    await new Promise<void>((resolve) => {
      prefs.ready(() => {
        console.log('偏好设置已准备完成');
        resolve();
      });
    });

    // 等待数据库和规则缓存完全准备好
    await this.waitForRulesReady();

    // 创建API处理器
    createApiHandler();
    console.log('API处理器已创建');

    // 设置规则变化监听
    this.setupRuleEventListeners();

    // 加载并应用规则
    await this.loadAndApplyRules();

    this.isInitialized = true;
    console.log('V3 规则处理器初始化完成');
  }

  private async waitForRulesReady(): Promise<void> {
    console.log('等待规则缓存准备完成...');

    // 等待所有表的缓存更新完成
    const maxRetries = 30; // 最多等待30秒
    let retries = 0;

    while (retries < maxRetries) {
      let allReady = true;

      for (const tableName of TABLE_NAMES_ARR) {
        const tableRules = rules.get(tableName);
        if (tableRules === null) {
          allReady = false;
          break;
        }
      }

      if (allReady) {
        console.log('所有规则缓存已准备完成');
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
      retries++;
    }

    logger.warn('等待规则缓存超时，但继续初始化');
  }

  private setupRuleEventListeners(): void {
    console.log('设置规则变化事件监听...');

    // 监听规则更新事件
    notify.event.on(EVENTs.RULE_UPDATE, (event: any) => {
      console.log('收到规则更新事件:', event);
      this.handleRuleChange();
    });

    // 监听规则删除事件
    notify.event.on(EVENTs.RULE_DELETE, (event: any) => {
      console.log('收到规则删除事件:', event);
      this.handleRuleChange();
    });
  }

  private async handleRuleChange(): Promise<void> {
    if (!this.isInitialized) {
      console.log('规则处理器尚未初始化，跳过规则变化处理');
      return;
    }

    try {
      console.log('处理规则变化，重新应用规则...');
      await this.loadAndApplyRules();
      console.log('规则变化处理完成');
    } catch (error) {
      logger.error('处理规则变化时发生错误:', error);
      console.error('处理规则变化失败:', error);
    }
  }

  async loadAndApplyRules(): Promise<void> {
    try {
      // 检查扩展是否被禁用
      if (prefs.get('disable-all')) {
        console.log('扩展已被禁用，清除所有规则');
        await V3RuleConverter.applyV3Rules([]);
        return;
      }

      // 获取所有启用的规则
      const allRules: any[] = [];
      for (const tableName of TABLE_NAMES_ARR) {
        const tableRules = rules.get(tableName, { enable: true }) || [];
        allRules.push(...tableRules);
      }

      console.log(`加载了 ${allRules.length} 个启用的规则`);

      if (allRules.length === 0) {
        // 清除所有动态规则
        await V3RuleConverter.applyV3Rules([]);
        logger.info('没有启用的规则，已清除所有动态规则');
        return;
      }

      // 转换规则为 V3 格式
      const conversionResult = V3RuleConverter.convertRulesToV3(allRules);
      this.conversionStats = conversionResult;

      // 检查规则限制
      const limitCheck = V3RuleConverter.checkRuleLimits(conversionResult.convertedRules);
      if (!limitCheck.isValid) {
        logger.warn('规则超过 V3 限制:', limitCheck.errors);
        console.warn('规则超过 V3 限制:', limitCheck.errors);
      }

      // 应用 V3 规则
      await V3RuleConverter.applyV3Rules(conversionResult.convertedRules);

      const stats = {
        total: allRules.length,
        converted: conversionResult.convertedRules.length,
        unconverted: conversionResult.unconvertedRules.length,
        warnings: conversionResult.warnings.length,
      };

      logger.info('规则应用完成:', stats);
      console.log('规则应用统计:', stats);

      if (conversionResult.unconvertedRules.length > 0) {
        console.warn('无法转换的规则:', conversionResult.unconvertedRules.map((r) => r.name));
      }

      if (conversionResult.warnings.length > 0) {
        console.warn('转换警告:', conversionResult.warnings);
      }
    } catch (error) {
      logger.error('应用规则时发生错误:', error);
      console.error('应用规则失败:', error);
      throw error;
    }
  }

  async refresh(): Promise<void> {
    console.log('刷新规则...');
    await this.loadAndApplyRules();
  }

  getStats(): any {
    return this.conversionStats;
  }
}

// 测试 x-tag header 规则
async function testXTagHeaderRule() {
  console.log('开始测试 x-tag header 规则...');

  try {
    // 1. 检查当前规则
    console.log('1. 检查现有的 sendHeader 规则...');
    const currentSendRules = rules.get(TABLE_NAMES.sendHeader, { enable: true }) || [];
    console.log(`当前有 ${currentSendRules.length} 个启用的发送头规则`);

    const xTagRules = currentSendRules.filter((rule) =>
      rule.action &&
      typeof rule.action === 'object' &&
      rule.action.name &&
      rule.action.name.toLowerCase() === 'x-tag');

    console.log(`其中有 ${xTagRules.length} 个 x-tag 规则:`, xTagRules);

    // 2. 创建测试规则（如果不存在）
    if (xTagRules.length === 0) {
      console.log('2. 创建测试 x-tag 规则...');
      const testXTagRule = {
        id: -1, // 新规则
        name: '测试 X-Tag Header',
        enable: true,
        ruleType: RULE_TYPE.MODIFY_SEND_HEADER,
        matchType: RULE_MATCH_TYPE.ALL,
        pattern: '*',
        isFunction: false,
        code: '',
        exclude: '',
        group: 'test',
        action: {
          name: 'X-Tag',
          value: 'HeaderEditor-Test',
        },
      };

      console.log('准备保存测试规则:', testXTagRule);
      const savedRule = await rules.save(testXTagRule);
      console.log('测试规则保存成功:', savedRule);

      // 等待一下让事件处理完成
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    // 3. 重新检查规则
    console.log('3. 重新检查规则...');
    const updatedSendRules = rules.get(TABLE_NAMES.sendHeader, { enable: true }) || [];
    const updatedXTagRules = updatedSendRules.filter((rule) =>
      rule.action &&
      typeof rule.action === 'object' &&
      rule.action.name &&
      rule.action.name.toLowerCase().includes('tag'));
    console.log(`现在有 ${updatedXTagRules.length} 个 tag 相关规则:`, updatedXTagRules);

    // 4. 检查规则转换
    console.log('4. 测试规则转换...');
    if (updatedXTagRules.length > 0) {
      const conversionResult = V3RuleConverter.convertRulesToV3(updatedXTagRules);
      console.log('规则转换结果:', {
        converted: conversionResult.convertedRules.length,
        unconverted: conversionResult.unconvertedRules.length,
        warnings: conversionResult.warnings,
      });

      if (conversionResult.convertedRules.length > 0) {
        console.log('转换后的 V3 规则:', conversionResult.convertedRules);
      }

      if (conversionResult.warnings.length > 0) {
        console.warn('转换警告:', conversionResult.warnings);
      }
    }

    // 5. 检查当前应用的 V3 规则
    console.log('5. 检查当前应用的 V3 规则...');
    const currentV3Rules = await V3RuleConverter.getCurrentRules();
    console.log(`当前已应用 ${currentV3Rules.length} 个 V3 规则`);

    const v3HeaderRules = currentV3Rules.filter((rule) =>
      rule.action &&
      rule.action.type === 'modifyHeaders' &&
      rule.action.requestHeaders &&
      rule.action.requestHeaders.some((header) =>
        header.header && header.header.toLowerCase().includes('tag')));

    console.log(`其中有 ${v3HeaderRules.length} 个修改 tag header 的 V3 规则:`, v3HeaderRules);

    // 6. 刷新规则应用
    console.log('6. 刷新规则应用...');
    if (ruleHandler) {
      await ruleHandler.refresh();
      console.log('规则刷新完成');

      // 再次检查 V3 规则
      const refreshedV3Rules = await V3RuleConverter.getCurrentRules();
      const refreshedHeaderRules = refreshedV3Rules.filter((rule) =>
        rule.action &&
        rule.action.type === 'modifyHeaders' &&
        rule.action.requestHeaders &&
        rule.action.requestHeaders.some((header) =>
          header.header && header.header.toLowerCase().includes('tag')));

      console.log(`刷新后有 ${refreshedHeaderRules.length} 个修改 tag header 的 V3 规则:`, refreshedHeaderRules);
    }

    // 7. 提供测试建议
    console.log('7. 测试建议:');
    console.log('请访问任意网站（如 https://httpbin.org/headers）查看请求头是否包含 X-Tag');
    console.log('您也可以在开发者工具的 Network 标签中查看请求头');

    console.log('x-tag header 规则测试完成');
  } catch (error) {
    console.error('测试 x-tag header 规则时发生错误:', error);
  }
}

// 导出测试函数到全局
if (typeof globalThis !== 'undefined') {
  globalThis.testXTagHeaderRule = testXTagHeaderRule;
}

// 全局规则处理器实例
let ruleHandler: V3RuleHandler | null = null;

// 测试辅助函数
async function testRuleApplication() {
  if (!ruleHandler) {
    console.error('规则处理器未初始化');
    return;
  }

  console.log('开始测试规则应用功能...');

  try {
    // 1. 测试获取现有规则
    console.log('1. 获取现有规则...');
    const currentRules = await V3RuleConverter.getCurrentRules();
    console.log(`当前已应用 ${currentRules.length} 个 V3 规则`);

    // 2. 测试规则转换
    console.log('2. 测试规则转换...');
    const testRule = {
      id: 999,
      name: '测试规则',
      enable: true,
      ruleType: RULE_TYPE.MODIFY_SEND_HEADER,
      matchType: RULE_MATCH_TYPE.ALL,
      pattern: '*',
      isFunction: false,
      code: '',
      exclude: '',
      group: 'test',
      action: {
        name: 'User-Agent',
        value: 'Test-Agent',
      },
    };

    const conversionResult = V3RuleConverter.convertRulesToV3([testRule]);
    console.log('规则转换结果:', {
      converted: conversionResult.convertedRules.length,
      unconverted: conversionResult.unconvertedRules.length,
      warnings: conversionResult.warnings.length,
    });

    if (conversionResult.convertedRules.length > 0) {
      console.log('转换后的 V3 规则:', conversionResult.convertedRules[0]);
    }

    // 3. 测试规则限制检查
    console.log('3. 测试规则限制检查...');
    const limits = V3RuleConverter.getRuleLimits();
    const limitCheck = V3RuleConverter.checkRuleLimits(conversionResult.convertedRules);
    console.log('规则限制:', limits);
    console.log('规则限制检查结果:', limitCheck);

    // 4. 测试规则刷新
    console.log('4. 测试规则刷新...');
    await ruleHandler.refresh();
    console.log('规则刷新完成');

    // 5. 获取统计信息
    console.log('5. 获取统计信息...');
    const stats = ruleHandler.getStats();
    console.log('转换统计:', stats);

    // 6. 验证规则数量
    console.log('6. 验证规则数量...');
    const newRules = await V3RuleConverter.getCurrentRules();
    console.log(`刷新后已应用 ${newRules.length} 个 V3 规则`);

    console.log('规则应用功能测试完成');
  } catch (error) {
    console.error('测试规则应用功能时发生错误:', error);
  }
}

// 导出测试函数到全局
if (typeof globalThis !== 'undefined') {
  globalThis.testRuleApplication = testRuleApplication;
}

// 初始化函数
async function initialize() {
  try {
    console.log('开始初始化 Header Editor...');

    ruleHandler = new V3RuleHandler();
    await ruleHandler.initialize();

    console.log('Header Editor 初始化完成');

    // 在调试模式下运行测试
    if (logger.getLevel() === 'DEBUG') {
      setTimeout(() => {
        testRuleApplication();
      }, 2000);
    }
  } catch (error) {
    console.error('Header Editor 初始化失败:', error);

    // 显示错误通知
    try {
      await chrome.notifications.create({
        type: 'basic',
        iconUrl: 'assets/images/128.png',
        title: 'Header Editor 初始化失败',
        message: '请检查控制台错误信息，或重新加载扩展。',
      });
    } catch (notifyError) {
      console.error('显示通知失败:', notifyError);
    }
  }
}

// 监听规则更新事件
if (typeof chrome !== 'undefined' && chrome.runtime) {
  // 监听安装事件
  chrome.runtime.onInstalled.addListener((details) => {
    console.log('Extension installed:', details.reason);

    if (details.reason === 'install') {
      // 首次安装时打开选项页面
      try {
        chrome.tabs.create({
          url: chrome.runtime.getURL('options.html'),
        });
      } catch (error) {
        console.log('无法创建选项页面:', error);
      }
    }
  });

  // 监听启动事件
  chrome.runtime.onStartup.addListener(() => {
    console.log('Extension startup');
  });

  // 监听偏好设置变化
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes['disable-all']) {
      console.log('检测到 disable-all 偏好设置变化:', changes['disable-all']);
      if (ruleHandler) {
        ruleHandler.refresh();
      }
    }
  });

  // 监听开发者工具命令
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.method === 'testRuleApplication') {
      testRuleApplication().then(() => {
        sendResponse({ success: true });
      }).catch((error) => {
        sendResponse({ success: false, error: error.message });
      });
      return true; // 保持消息通道开放
    }

    if (request.method === 'getRuleStats') {
      const stats = ruleHandler?.getStats() || null;
      sendResponse({ stats });
      return true;
    }

    if (request.method === 'enableDebugLogging') {
      logger.enableDebug();
      sendResponse({ success: true, level: logger.getLevel() });
      return true;
    }

    if (request.method === 'disableDebugLogging') {
      logger.disableDebug();
      sendResponse({ success: true, level: logger.getLevel() });
      return true;
    }
  });
}

// 简单的状态检查
console.log('Service Worker 环境检查:', {
  hasChrome: typeof chrome !== 'undefined',
  hasRuntime: typeof chrome !== 'undefined' && !!chrome.runtime,
  hasDeclarativeNetRequest: typeof chrome !== 'undefined' && !!(chrome as any).declarativeNetRequest,
});

// 启动初始化
initialize().catch(console.error);

// 导出全局访问
if (typeof globalThis !== 'undefined') {
  globalThis.headerEditorRuleHandler = ruleHandler;
}
