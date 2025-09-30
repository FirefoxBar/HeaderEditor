import browser from 'webextension-polyfill';
import type { DeclarativeNetRequest } from 'webextension-polyfill/namespaces/declarativeNetRequest';
import {
  ALL_RESOURCE_TYPES,
  RULE_MATCH_TYPE,
  RULE_TYPE,
  TABLE_NAMES,
} from '@/share/core/constant';
import emitter from '@/share/core/emitter';
import logger from '@/share/core/logger';
import { prefs } from '@/share/core/prefs';
import { detectRunner } from '@/share/core/rule-utils';
import SessionMessage from '@/share/core/session-message';
import type { RULE_ACTION_OBJ, Rule } from '@/share/core/types';
import { getTableName, isValidArray, t } from '@/share/core/utils';
import { getAll, waitLoad } from '../core/rules';

type DNRRule = DeclarativeNetRequest.Rule;

function createDNR(rule: Rule, id: number) {
  const res: DNRRule = {
    id,
    action: {
      type: 'upgradeScheme',
    },
    condition: {
      // All resource types
      resourceTypes: ALL_RESOURCE_TYPES,
    },
  };

  let isRegex = false;
  if (rule.condition) {
    const {
      all,
      url,
      urlPrefix,
      domain,
      excludeDomain,
      regex,
      resourceTypes,
      excludeResourceTypes,
      excludeMethod,
      method,
    } = rule.condition;
    res.condition.requestDomains = domain;
    // 只能指定 urlFilter 或 regexFilter 中的一项。
    if (regex) {
      res.condition.regexFilter = regex;
      isRegex = true;
    } else if (all) {
      res.condition.urlFilter = '*';
    } else if (url) {
      res.condition.urlFilter = url;
    } else if (urlPrefix) {
      res.condition.urlFilter = `${urlPrefix}*`;
    }
    if (isValidArray(excludeDomain)) {
      res.condition.excludedRequestDomains = excludeDomain;
    }
    // 应仅指定 requestMethods 和 excludedRequestMethods 中的一项
    if (isValidArray(method)) {
      res.condition.requestMethods = method;
    }
    if (isValidArray(excludeMethod)) {
      delete res.condition.requestMethods;
      res.condition.excludedRequestMethods = excludeMethod;
    }
    // 应仅指定 resourceTypes 和 excludedResourceTypes 中的一项
    if (isValidArray(resourceTypes)) {
      res.condition.resourceTypes = resourceTypes;
    }
    if (isValidArray(excludeResourceTypes)) {
      delete res.condition.resourceTypes;
      res.condition.excludedResourceTypes = excludeResourceTypes;
    }
  } else {
    // match condition
    switch (rule.matchType) {
      case RULE_MATCH_TYPE.DOMAIN:
        if (rule.pattern) {
          res.condition.requestDomains = [rule.pattern];
        }
        break;
      case RULE_MATCH_TYPE.URL:
        res.condition.urlFilter = rule.pattern;
        break;
      case RULE_MATCH_TYPE.ALL:
        res.condition.urlFilter = '*';
        break;
      case RULE_MATCH_TYPE.PREFIX:
        res.condition.urlFilter = `${rule.pattern}*`;
        break;
      case RULE_MATCH_TYPE.REGEXP:
        isRegex = true;
        res.condition.regexFilter = rule.pattern;
        break;
      default:
        break;
    }
  }

  if (rule.ruleType === RULE_TYPE.CANCEL) {
    res.action.type = 'block';
  }
  if (rule.ruleType === RULE_TYPE.REDIRECT) {
    res.action.type = 'redirect';
    if (isRegex) {
      res.action.redirect = {
        regexSubstitution: String(rule.to).replace(/\$(\d+)/g, '\\$1'),
      };
    } else {
      res.action.redirect = {
        url: rule.to,
      };
    }
  }

  const createHeaderItem = (
    header: string,
    value: any,
  ): DeclarativeNetRequest.RuleActionResponseHeadersItemType => {
    if (
      value === '_header_editor_remove_' ||
      value === '' ||
      value === null ||
      typeof value === 'undefined'
    ) {
      return {
        header,
        operation: 'remove',
      };
    }
    return {
      header,
      operation: 'set',
      value,
    };
  };

  if (
    [RULE_TYPE.MODIFY_SEND_HEADER, RULE_TYPE.MODIFY_RECV_HEADER].includes(
      rule.ruleType,
    )
  ) {
    res.action.type = 'modifyHeaders';
    const key =
      rule.ruleType === RULE_TYPE.MODIFY_SEND_HEADER
        ? 'requestHeaders'
        : 'responseHeaders';
    if (rule.headers) {
      res.action[key] = Object.keys(rule.headers).map(key =>
        createHeaderItem(key, rule.headers![key]),
      );
    } else if (typeof rule.action === 'object') {
      const action = rule.action as RULE_ACTION_OBJ;
      res.action[key] = [createHeaderItem(action.name, action.value)];
    }
  }

  if (IS_DEV) {
    console.log('create dnr rule', rule, res);
  }

  return res;
}

function getRuleId(id: number, table?: TABLE_NAMES, ruleType?: RULE_TYPE) {
  const list = {
    [TABLE_NAMES.request]: 0,
    [TABLE_NAMES.sendHeader]: 100000,
    [TABLE_NAMES.receiveHeader]: 200000,
    [TABLE_NAMES.receiveBody]: 300000,
  };

  const t = table || getTableName(ruleType || RULE_TYPE.REDIRECT);

  return Number(id) + list[t];
}

class DNRRequestHandler {
  private disableAll = false;

  constructor() {
    this.loadPrefs();
    this.initHook();
    this.initRules();
  }

  private setDisableAll(to: boolean) {
    if (this.disableAll === to) {
      return;
    }
    logger.debug('[dnr-handler] disableAll', to);
    this.disableAll = to;
    if (IS_DEV) {
      console.log('[dnr-handler] disableAll', to);
    }
    if (to) {
      // disable all
      this.clearRules();
    } else {
      this.initRules();
    }
  }

  private async clearRules() {
    const current = await browser.declarativeNetRequest.getSessionRules();
    await browser.declarativeNetRequest.updateSessionRules({
      removeRuleIds: current.map(x => x.id),
    });
  }

  private async initRules() {
    if (this.disableAll) {
      return;
    }

    await waitLoad();

    const v = Object.values(getAll());

    // if service worker restart, get exists rules
    const current = (await browser.declarativeNetRequest.getSessionRules()).map(
      x => x.id,
    );
    const allRules = v.reduce((a, b) => [...a!, ...b!], []) || [];
    const addOriginalRules: Rule[] = [];
    const addRules: DNRRule[] = [];
    allRules.forEach(rule => {
      if (rule._runner !== 'dnr') {
        return;
      }
      const ruleId = getRuleId(rule.id, undefined, rule.ruleType);
      if (current.includes(ruleId)) {
        // rule exists
        return;
      }
      if (!rule.enable) {
        return;
      }
      addOriginalRules.push(rule);
      addRules.push(createDNR(rule, ruleId));
    });
    if (this.disableAll) {
      return;
    }
    if (IS_DEV) {
      console.log('init dnr rules', addRules, this.disableAll);
    }
    if (isValidArray(addRules)) {
      this.addRules(addRules, addOriginalRules);
    }
  }

  private initHook() {
    emitter.on(emitter.INNER_RULE_REMOVE, ({ table, id }) => {
      const old = getRuleId(id, table);
      browser.declarativeNetRequest.updateSessionRules({
        removeRuleIds: [old],
      });
    });

    emitter.on(
      emitter.INNER_RULE_UPDATE,
      async ({ from, target }: { from: Rule; target: Rule }) => {
        if (this.disableAll) {
          return;
        }
        logger.debug('[dnr-handler] rules update', from, target);
        if (from) {
          const old = getRuleId(from.id, undefined, from.ruleType);
          await browser.declarativeNetRequest.updateSessionRules({
            removeRuleIds: [old],
          });
        }
        // detect new rule is DNR or not
        if (detectRunner(target) === 'dnr' && target.enable) {
          this.addRule(
            createDNR(target, getRuleId(target.id, undefined, target.ruleType)),

            target,
          );
        }
      },
    );
  }

  private loadPrefs() {
    emitter.on(emitter.EVENT_PREFS_UPDATE, (key: string, val: any) => {
      switch (key) {
        case 'disable-all':
          this.setDisableAll(Boolean(val));
          break;
        default:
          break;
      }
    });

    prefs.ready(() => {
      this.setDisableAll(Boolean(prefs.get('disable-all')));
    });
  }

  private async addRule(rule: DNRRule, originalRule: Rule) {
    try {
      await browser.declarativeNetRequest.updateSessionRules({
        addRules: [rule],
      });
    } catch (e) {
      console.error('Add DNR rule failed', e, rule, originalRule);
      SessionMessage.add({
        type: 'warning',
        title: t('init_rule_failed'),
        content: `Rule: [${originalRule.id}] ${originalRule.name}\nError: ${(e as Error).message}`,
        more: `Rule: ${JSON.stringify(originalRule)}\nDNR Rule: ${JSON.stringify(rule)}`,
      });
    }
  }

  private async addRules(rules: DNRRule[], originalRules: Rule[]) {
    if (rules.length === 0) {
      return;
    }
    if (rules.length === 1) {
      return this.addRule(rules[0], originalRules[0]);
    }
    try {
      await browser.declarativeNetRequest.updateSessionRules({
        addRules: rules,
      });
    } catch (_) {
      return Promise.all(
        rules.map((rule, idx) => this.addRule(rule, originalRules[idx])),
      );
    }
  }
}

export const createDNRHandler = () => new DNRRequestHandler();
