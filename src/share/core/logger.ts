// @ts-ignore
import { IS_BACKGROUND } from './utils';

interface LogLevel {
  DEBUG: 0;
  INFO: 1;
  WARN: 2;
  ERROR: 3;
}

const LOG_LEVELS: LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

class Logger {
  private currentLevel: number = LOG_LEVELS.INFO;
  private prefix = '';

  constructor() {
    this.prefix = IS_BACKGROUND ? '[Header Editor BG]' : '[Header Editor]';

    // 在开发环境下启用调试日志
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getManifest) {
      try {
        const manifest = chrome.runtime.getManifest();
        if (manifest.name?.includes('dev') || manifest.version?.includes('dev')) {
          this.currentLevel = LOG_LEVELS.DEBUG;
        }
      } catch (e) {
        // 忽略错误
      }
    }
  }

  private formatMessage(level: string, message: string, ..._args: any[]): string {
    const timestamp = new Date().toISOString();
    const context = IS_BACKGROUND ? 'BG' : 'CS';
    return `${timestamp} [${context}] ${level}: ${message}`;
  }

  private log(level: number, levelName: string, message: string, ...args: any[]) {
    if (level < this.currentLevel) {
      return;
    }

    const formattedMessage = this.formatMessage(levelName, message);

    switch (level) {
      case LOG_LEVELS.DEBUG:
        console.debug(this.prefix, formattedMessage, ...args);
        break;
      case LOG_LEVELS.INFO:
        console.info(this.prefix, formattedMessage, ...args);
        break;
      case LOG_LEVELS.WARN:
        console.warn(this.prefix, formattedMessage, ...args);
        break;
      case LOG_LEVELS.ERROR:
        console.error(this.prefix, formattedMessage, ...args);
        break;
      default:
        console.log(this.prefix, formattedMessage, ...args);
    }
  }

  debug(message: string, ...args: any[]) {
    this.log(LOG_LEVELS.DEBUG, 'DEBUG', message, ...args);
  }

  info(message: string, ...args: any[]) {
    this.log(LOG_LEVELS.INFO, 'INFO', message, ...args);
  }

  warn(message: string, ...args: any[]) {
    this.log(LOG_LEVELS.WARN, 'WARN', message, ...args);
  }

  error(message: string, ...args: any[]) {
    this.log(LOG_LEVELS.ERROR, 'ERROR', message, ...args);
  }

  // 设置日志级别
  setLevel(level: keyof LogLevel) {
    this.currentLevel = LOG_LEVELS[level];
    this.info(`日志级别设置为: ${level}`);
  }

  // 获取当前日志级别
  getLevel(): string {
    const levels = Object.keys(LOG_LEVELS);
    return levels.find((key) => LOG_LEVELS[key as keyof LogLevel] === this.currentLevel) || 'INFO';
  }

  // 启用调试模式
  enableDebug() {
    this.setLevel('DEBUG');
  }

  // 禁用调试模式
  disableDebug() {
    this.setLevel('INFO');
  }

  // 记录规则转换详情
  logRuleConversion(rule: any, v3Rule: any, success: boolean) {
    if (success) {
      this.debug('规则转换成功', {
        originalRule: {
          id: rule.id,
          name: rule.name,
          type: rule.ruleType,
          matchType: rule.matchType,
          pattern: rule.pattern,
          enable: rule.enable,
        },
        v3Rule: {
          id: v3Rule.id,
          priority: v3Rule.priority,
          actionType: v3Rule.action?.type,
          conditionKeys: Object.keys(v3Rule.condition || {}),
        },
      });
    } else {
      this.warn('规则转换失败', {
        rule: {
          id: rule.id,
          name: rule.name,
          type: rule.ruleType,
          matchType: rule.matchType,
          pattern: rule.pattern,
        },
      });
    }
  }

  // 记录 V3 规则应用详情
  logV3RuleApplication(rules: any[], success: boolean, error?: any) {
    if (success) {
      this.info('V3 规则应用成功', {
        ruleCount: rules.length,
        ruleIds: rules.map((r) => r.id),
        ruleTypes: rules.reduce((types: Record<string, number>, rule) => {
          const type = rule.action?.type || 'unknown';
          types[type] = (types[type] ?? 0) + 1;
          return types;
        }, {}),
      });
    } else {
      this.error('V3 规则应用失败', {
        ruleCount: rules.length,
        error: error?.message || '未知错误',
        stack: error?.stack,
      });
    }
  }

  // 记录规则匹配详情
  logRuleMatch(url: string, rule: any, matched: boolean) {
    this.debug('规则匹配检查', {
      url,
      rule: {
        id: rule.id,
        name: rule.name,
        type: rule.ruleType,
        matchType: rule.matchType,
        pattern: rule.pattern,
      },
      matched,
    });
  }

  // 记录性能信息
  logPerformance(operation: string, duration: number) {
    this.info(`性能统计: ${operation} 耗时 ${duration}ms`);
  }

  // 记录扩展状态
  logExtensionState(state: any) {
    this.info('扩展状态', {
      enabled: !state.disabled,
      rulesCount: state.rulesCount || 0,
      v3RulesCount: state.v3RulesCount || 0,
      lastUpdate: state.lastUpdate || 'never',
    });
  }
}

const logger = new Logger();

export default logger;
