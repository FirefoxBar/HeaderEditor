import browser from 'webextension-polyfill';
import type { Rule } from '@/share/core/types';
import logger from '@/share/core/logger';

// declarativeNetRequest 规则接口
interface V3Rule {
  id: number;
  priority: number;
  action: {
    type: 'block' | 'redirect' | 'modifyHeaders' | 'upgradeScheme' | 'allow' | 'allowAllRequests';
    redirect?: { url: string; regexSubstitution?: string };
    requestHeaders?: Array<{
      header: string;
      operation: 'set' | 'remove' | 'append';
      value?: string;
    }>;
    responseHeaders?: Array<{
      header: string;
      operation: 'set' | 'remove' | 'append';
      value?: string;
    }>;
  };
  condition: {
    urlFilter?: string;
    regexFilter?: string;
    domains?: string[];
    excludedDomains?: string[];
    resourceTypes?: browser.DeclarativeNetRequest.ResourceType[];
    excludedResourceTypes?: browser.DeclarativeNetRequest.ResourceType[];
    requestMethods?: string[];
    excludedRequestMethods?: string[];
  };
}

// 转换结果接口
interface ConversionResult {
  convertedRules: V3Rule[];
  unconvertedRules: Rule[];
  warnings: string[];
}

export class V3RuleConverter {
  private static ruleIdCounter = 1000; // 从1000开始，避免与静态规则冲突

  /**
   * 将传统规则转换为 V3 规则
   */
  static convertRulesToV3(rules: Rule[]): ConversionResult {
    const convertedRules: V3Rule[] = [];
    const unconvertedRules: Rule[] = [];
    const warnings: string[] = [];

    // 重置规则ID计数器
    this.ruleIdCounter = 1000;

    for (const rule of rules) {
      try {
        if (this.isConvertible(rule)) {
          const v3Rule = this.convertSingleRule(rule);
          if (v3Rule) {
            convertedRules.push(v3Rule);
          }
        } else {
          unconvertedRules.push(rule);
          let reason = '未知原因';
          if (rule.isFunction) {
            reason = '包含自定义函数';
          } else if (rule.ruleType === 'modifyReceiveBody') {
            reason = '不支持响应体修改';
          } else if (rule.matchType === 'regexp' && this.isComplexRegex(rule.pattern)) {
            reason = '包含复杂的正则表达式';
          }
          warnings.push(`规则 "${rule.name}" 无法转换为 V3 格式: ${reason}`);
        }
      } catch (error) {
        logger.error(`转换规则 "${rule.name}" 时发生错误:`, error);
        unconvertedRules.push(rule);
        warnings.push(`规则 "${rule.name}" 转换失败: ${error.message}`);
      }
    }

    return { convertedRules, unconvertedRules, warnings };
  }

  /**
   * 检查规则是否可以转换为 V3 格式
   */
  private static isConvertible(rule: Rule): boolean {
    // 不支持自定义函数
    if (rule.isFunction) {
      return false;
    }

    // 不支持响应体修改
    if (rule.ruleType === 'modifyReceiveBody') {
      return false;
    }

    // 检查是否为支持的规则类型
    const supportedTypes = ['cancel', 'redirect', 'modifySendHeader', 'modifyReceiveHeader'];
    if (!supportedTypes.includes(rule.ruleType)) {
      return false;
    }

    // 检查正则表达式复杂度
    if (rule.matchType === 'regexp' && this.isComplexRegex(rule.pattern)) {
      return false;
    }

    return true;
  }

  /**
   * 检查是否为复杂正则表达式
   */
  private static isComplexRegex(pattern: string): boolean {
    // 简单检查，如果包含复杂的正则特性，认为是复杂的
    const complexFeatures = [
      '\\d', '\\w', '\\s', '\\D', '\\W', '\\S', // 字符类
      '\\b', '\\B', // 边界
      '(?:', '(?=', '(?!', '(?<=', '(?<!', // 分组和断言
      '\\k<', '\\p{', '\\P{', // 命名组和Unicode属性
      '\\x', '\\u', '\\0', // 十六进制和Unicode转义
      '\\c', '\\f', '\\n', '\\r', '\\t', '\\v', // 控制字符
    ];

    return complexFeatures.some((feature) => pattern.includes(feature));
  }

  /**
   * 转换单个规则
   */
  private static convertSingleRule(rule: Rule): V3Rule | null {
    const startTime = Date.now();

    try {
      const v3Rule: V3Rule = {
        id: this.ruleIdCounter++,
        priority: Math.max(1, Math.min(100, rule.priority || 1)), // 确保优先级在有效范围内
        action: this.convertAction(rule),
        condition: this.convertCondition(rule),
      };

      // 验证生成的规则
      if (!this.validateV3Rule(v3Rule)) {
        logger.warn(`规则 "${rule.name}" 转换后验证失败，跳过应用`);
        logger.logRuleConversion(rule, v3Rule, false);
        return null;
      }

      const duration = Date.now() - startTime;
      logger.logPerformance(`规则转换 ${rule.name}`, duration);
      logger.logRuleConversion(rule, v3Rule, true);

      return v3Rule;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error(`转换规则 "${rule.name}" 时发生错误:`, error);
      logger.logPerformance(`规则转换失败 ${rule.name}`, duration);
      logger.logRuleConversion(rule, null, false);
      return null;
    }
  }

  /**
   * 验证 V3 规则是否有效
   */
  private static validateV3Rule(rule: V3Rule): boolean {
    // 检查 ID 是否有效
    if (!rule.id || rule.id < 1) {
      return false;
    }

    // 检查优先级是否有效
    if (rule.priority < 1 || rule.priority > 100) {
      return false;
    }

    // 检查动作是否有效
    if (!rule.action || !rule.action.type) {
      return false;
    }

    // 检查条件是否有效
    if (!rule.condition) {
      return false;
    }

    // 至少需要一个匹配条件
    const hasMatchCondition =
      rule.condition.urlFilter ||
      rule.condition.regexFilter ||
      rule.condition.domains?.length ||
      rule.condition.excludedDomains?.length;

    if (!hasMatchCondition) {
      return false;
    }

    return true;
  }

  /**
   * 转换规则动作
   */
  private static convertAction(rule: Rule): V3Rule['action'] {
    switch (rule.ruleType) {
      case 'cancel':
        return { type: 'block' };

      case 'redirect':
        if (rule.to) {
          // 简单的 URL 重定向
          if (rule.matchType === 'regexp' && !this.isComplexRegex(rule.pattern)) {
            return {
              type: 'redirect',
              redirect: {
                url: rule.to,
                regexSubstitution: rule.to,
              },
            };
          } else {
            return {
              type: 'redirect',
              redirect: { url: rule.to },
            };
          }
        }
        return { type: 'block' };

      case 'modifySendHeader':
        return {
          type: 'modifyHeaders',
          requestHeaders: this.convertHeaders(rule),
        };

      case 'modifyReceiveHeader':
        return {
          type: 'modifyHeaders',
          responseHeaders: this.convertHeaders(rule),
        };

      default:
        throw new Error(`不支持的规则类型: ${rule.ruleType}`);
    }
  }

  /**
   * 转换请求头/响应头
   */
  private static convertHeaders(rule: Rule): Array<{
    header: string;
    operation: 'set' | 'remove' | 'append';
    value?: string;
  }> {
    if (!rule.action || typeof rule.action !== 'object') {
      return [];
    }

    const headers: Array<{
      header: string;
      operation: 'set' | 'remove' | 'append';
      value?: string;
    }> = [];

    if (rule.action.name && rule.action.value !== undefined) {
      const headerName = rule.action.name.trim();
      if (!headerName) {
        return [];
      }

      if (rule.action.value === '_header_editor_remove_') {
        headers.push({
          header: headerName,
          operation: 'remove',
        });
      } else {
        headers.push({
          header: headerName,
          operation: 'set',
          value: String(rule.action.value),
        });
      }
    }

    return headers;
  }

  /**
   * 转换匹配条件
   */
  private static convertCondition(rule: Rule): V3Rule['condition'] {
    const condition: V3Rule['condition'] = {};

    // 设置资源类型
    if (rule.ruleType === 'modifySendHeader') {
      // 请求头修改适用于所有资源类型
      condition.resourceTypes = [
        'main_frame', 'sub_frame', 'stylesheet', 'script', 'image',
        'font', 'object', 'xmlhttprequest', 'ping', 'csp_report',
        'media', 'websocket', 'other',
      ];
    } else if (rule.ruleType === 'modifyReceiveHeader') {
      // 响应头修改适用于所有资源类型
      condition.resourceTypes = [
        'main_frame', 'sub_frame', 'stylesheet', 'script', 'image',
        'font', 'object', 'xmlhttprequest', 'ping', 'csp_report',
        'media', 'websocket', 'other',
      ];
    } else {
      // 其他规则类型使用默认资源类型
      condition.resourceTypes = [
        'main_frame', 'sub_frame', 'stylesheet', 'script', 'image',
        'font', 'object', 'xmlhttprequest', 'ping', 'csp_report',
        'media', 'websocket', 'other',
      ];
    }

    // 转换 URL 匹配
    switch (rule.matchType) {
      case 'all':
        // 匹配所有URL
        condition.urlFilter = '*';
        break;

      case 'regexp':
        if (!this.isComplexRegex(rule.pattern)) {
          condition.regexFilter = rule.pattern;
        } else {
          // 尝试将复杂正则转换为简单过滤器
          const simpleFilter = this.convertComplexRegexToFilter(rule.pattern);
          if (simpleFilter) {
            condition.urlFilter = simpleFilter;
          } else {
            condition.urlFilter = '*';
          }
        }
        break;

      case 'prefix':
        // URL前缀匹配
        condition.urlFilter = `${rule.pattern}*`;
        break;

      case 'domain': {
        // 域名匹配
        const domain = this.normalizeDomain(rule.pattern);
        if (domain) {
          condition.domains = [domain];
        } else {
          condition.urlFilter = '*';
        }
        break;
      }

      case 'url':
        // 完整URL匹配
        condition.urlFilter = rule.pattern;
        break;

      default:
        // 默认匹配所有
        condition.urlFilter = '*';
    }

    // 处理排除模式
    if (rule.exclude && rule.exclude.trim()) {
      try {
        const excludeDomain = this.normalizeDomain(rule.exclude);
        if (excludeDomain) {
          condition.excludedDomains = [excludeDomain];
        }
      } catch (error) {
        logger.warn(`无法处理排除模式 "${rule.exclude}":`, error);
      }
    }

    return condition;
  }

  /**
   * 标准化域名
   */
  private static normalizeDomain(domain: string): string {
    if (!domain) return '';

    // 移除协议前缀
    domain = domain.replace(/^https?:\/\//, '');

    // 移除路径
    domain = domain.split('/')[0];

    // 移除端口
    domain = domain.split(':')[0];

    // 移除 www. 前缀（可选）
    if (domain.startsWith('www.')) {
      domain = domain.substring(4);
    }

    return domain.toLowerCase();
  }

  /**
   * 检查是否为域名模式
   */
  private static isDomainPattern(pattern: string): boolean {
    // 简单检查是否像域名
    return /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(pattern);
  }

  /**
   * 将复杂正则表达式转换为简单过滤器
   */
  private static convertComplexRegexToFilter(regex: string): string {
    try {
      // 尝试提取简单的URL模式
      if (regex.includes('://')) {
        // 如果包含协议，提取域名部分
        const match = regex.match(/https?:\/\/([^/\s?]+)/);
        if (match) {
          return `*://${match[1]}/*`;
        }
      }

      // 提取域名模式
      const domainMatch = regex.match(/([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
      if (domainMatch) {
        return `*://${domainMatch[1]}/*`;
      }

      // 如果无法转换，返回通配符
      return '*';
    } catch (error) {
      logger.warn('转换复杂正则表达式失败:', error);
      return '*';
    }
  }

  /**
   * 从模式中提取域名
   */
  private static extractDomainFromPattern(pattern: string): string | null {
    try {
      const match = pattern.match(/(?:https?:\/\/)?([^/\s?]+)/);
      return match ? match[1] : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * 应用 V3 规则到浏览器
   */
  static async applyV3Rules(rules: V3Rule[]): Promise<void> {
    const startTime = Date.now();

    try {
      logger.info(`准备应用 ${rules.length} 个 V3 规则`);

      // 先移除现有的动态规则
      const existingRules = await browser.declarativeNetRequest.getDynamicRules();
      const existingRuleIds = existingRules.map((r) => r.id);

      if (existingRuleIds.length > 0) {
        logger.info(`移除现有的 ${existingRuleIds.length} 个动态规则`);
        await browser.declarativeNetRequest.updateDynamicRules({
          removeRuleIds: existingRuleIds,
        });
      }

      // 应用新规则
      if (rules.length > 0) {
        logger.info(`应用 ${rules.length} 个新规则`);

        // 分批应用规则，避免一次性应用太多规则
        const batchSize = 100;
        for (let i = 0; i < rules.length; i += batchSize) {
          const batch = rules.slice(i, i + batchSize);
          logger.debug(`应用规则批次 ${Math.floor(i / batchSize) + 1}/${Math.ceil(rules.length / batchSize)}, 包含 ${batch.length} 个规则`);

          await browser.declarativeNetRequest.updateDynamicRules({
            addRules: batch,
          });
        }
      }

      const duration = Date.now() - startTime;
      logger.logPerformance('V3 规则应用', duration);
      logger.logV3RuleApplication(rules, true);

      // 验证规则是否成功应用
      const newRules = await browser.declarativeNetRequest.getDynamicRules();
      if (newRules.length !== rules.length) {
        logger.warn(`规则应用不完整: 期望 ${rules.length} 个，实际 ${newRules.length} 个`);
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.logPerformance('V3 规则应用失败', duration);
      logger.logV3RuleApplication(rules, false, error);
      logger.error('应用 V3 规则时发生错误:', error);
      throw error;
    }
  }

  /**
   * 获取 V3 规则限制信息
   */
  static getRuleLimits(): {
    MAX_NUMBER_OF_DYNAMIC_RULES: number;
    MAX_NUMBER_OF_REGEX_RULES: number;
    MAX_NUMBER_OF_STATIC_RULES: number;
  } {
    return {
      MAX_NUMBER_OF_DYNAMIC_RULES: 30000,
      MAX_NUMBER_OF_REGEX_RULES: 1000,
      MAX_NUMBER_OF_STATIC_RULES: 30000,
    };
  }

  /**
   * 检查规则是否超过限制
   */
  static checkRuleLimits(rules: V3Rule[]): {
    isValid: boolean;
    errors: string[];
  } {
    const limits = this.getRuleLimits();
    const errors: string[] = [];

    if (rules.length > limits.MAX_NUMBER_OF_DYNAMIC_RULES) {
      errors.push(`规则数量 (${rules.length}) 超过限制 (${limits.MAX_NUMBER_OF_DYNAMIC_RULES})`);
    }

    const regexRules = rules.filter((r) => r.condition.regexFilter);
    if (regexRules.length > limits.MAX_NUMBER_OF_REGEX_RULES) {
      errors.push(`正则表达式规则数量 (${regexRules.length}) 超过限制 (${limits.MAX_NUMBER_OF_REGEX_RULES})`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * 获取当前应用的动态规则
   */
  static async getCurrentRules(): Promise<any[]> {
    try {
      const rules = await browser.declarativeNetRequest.getDynamicRules();
      return rules;
    } catch (error) {
      logger.error('获取当前规则失败:', error);
      return [];
    }
  }
}
