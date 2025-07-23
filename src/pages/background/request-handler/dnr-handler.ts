import browser from 'webextension-polyfill';
import { RULE_MATCH_TYPE, RULE_TYPE, TABLE_NAMES } from '@/share/core/constant';
import emitter from '@/share/core/emitter';
import { prefs } from '@/share/core/prefs';
import { detectRunner } from '@/share/core/rule-utils';
import type { Rule, RULE_ACTION_OBJ } from '@/share/core/types';
import logger from '@/share/core/logger';
import { getTableName } from '@/share/core/utils';
import { getAll, waitLoad } from '../core/rules';
import type { DeclarativeNetRequest } from 'webextension-polyfill/namespaces/declarativeNetRequest';

type DNRRule = DeclarativeNetRequest.Rule;

function createDNR(rule: Rule, id: number) {
  const res: DNRRule = {
    id,
    action: {
      type: 'upgradeScheme',
    },
    condition: {
      // All resource types
      resourceTypes: [
        'main_frame',
        'sub_frame',
        'stylesheet',
        'script',
        'image',
        'font',
        'object',
        'xmlhttprequest',
        'ping',
        'csp_report',
        'media',
        'websocket',
        'other',
      ],
    },
  };

  // match condition
  if (rule.matchType === RULE_MATCH_TYPE.DOMAIN) {
    res.condition.requestDomains = [rule.pattern];
  }
  if (rule.matchType === RULE_MATCH_TYPE.URL) {
    res.condition.urlFilter = rule.pattern;
  }
  if (rule.matchType === RULE_MATCH_TYPE.ALL) {
    res.condition.urlFilter = '*';
  }
  if (rule.matchType === RULE_MATCH_TYPE.PREFIX) {
    res.condition.urlFilter = `${rule.pattern}*`;
  }
  if (rule.matchType === RULE_MATCH_TYPE.REGEXP) {
    res.condition.regexFilter = rule.pattern;
  }

  if (rule.ruleType === RULE_TYPE.CANCEL) {
    res.action.type = 'block';
  }
  if (rule.ruleType === RULE_TYPE.REDIRECT) {
    res.action.type = 'redirect';
    if (rule.matchType === RULE_MATCH_TYPE.REGEXP) {
      res.action.redirect = {
        regexSubstitution: String(rule.to).replace(/\$(\d+)/g, '\\$1'),
      };
    } else {
      res.action.redirect = {
        url: rule.to,
      };
    }
  }
  if (rule.ruleType === RULE_TYPE.MODIFY_SEND_HEADER) {
    res.action.type = 'modifyHeaders';
    const action = rule.action as RULE_ACTION_OBJ;
    res.action.requestHeaders = [
      {
        header: action.name,
        operation: action.value === '_header_editor_remove_' ? 'remove' : 'set',
        value: action.value === '_header_editor_remove_' ? undefined : action.value,
      },
    ];
  }
  if (rule.ruleType === RULE_TYPE.MODIFY_RECV_HEADER) {
    res.action.type = 'modifyHeaders';
    const action = rule.action as RULE_ACTION_OBJ;
    res.action.responseHeaders = [
      {
        header: action.name,
        operation: action.value === '_header_editor_remove_' ? 'remove' : 'set',
        value: action.value === '_header_editor_remove_' ? undefined : action.value,
      },
    ];
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
  private _disableAll = false;

  constructor() {
    this.initHook();
    this.initRules();
    this.loadPrefs();
  }

  get disableAll() {
    return this._disableAll;
  }

  set disableAll(to) {
    if (this._disableAll === to) {
      return;
    }
    if (to) {
      // enable all
      this.initRules();
    } else {
      this.clearRules();
    }
  }

  private async clearRules() {
    const current = await browser.declarativeNetRequest.getSessionRules();
    await browser.declarativeNetRequest.updateSessionRules({
      removeRuleIds: current.map((x) => x.id),
    });
  }

  private async initRules() {
    await waitLoad();

    const v = Object.values(getAll());

    // if service worker restart, get exists rules
    const current = (await browser.declarativeNetRequest.getSessionRules()).map((x) => x.id);
    const allRules = v.reduce((a, b) => [...a!, ...b!], []) || [];
    const addRules: DNRRule[] = [];
    allRules.forEach((rule) => {
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
      addRules.push(createDNR(rule, ruleId));
    });
    if (IS_DEV) {
      console.log('init dnr rules', addRules);
    }
    if (addRules.length > 0) {
      browser.declarativeNetRequest.updateSessionRules({
        addRules,
      });
    }
  }

  private initHook() {
    emitter.on(emitter.INNER_RULE_REMOVE, ({ table, id }) => {
      const old = getRuleId(id, table);
      browser.declarativeNetRequest.updateSessionRules({
        removeRuleIds: [old],
      });
    });

    emitter.on(emitter.INNER_RULE_UPDATE, ({ from, target }: { from: Rule; target: Rule }) => {
      logger.debug('dnr rules update', from, target);
      const command: DeclarativeNetRequest.UpdateSessionRulesOptionsType = {
        removeRuleIds: [],
        addRules: [],
      };
      if (from) {
        const old = getRuleId(from.id, undefined, from.ruleType);
        command.removeRuleIds!.push(old);
      }
      // detect new rule is DNR or not
      if (detectRunner(target) === 'dnr' && target.enable) {
        command.addRules!.push(createDNR(target, getRuleId(target.id, undefined, target.ruleType)));
      }
      if (IS_DEV) {
        console.log('dnr rules update', command);
      }
      browser.declarativeNetRequest.updateSessionRules(command);
    });
  }

  private loadPrefs() {
    emitter.on(emitter.EVENT_PREFS_UPDATE, (key: string, val: any) => {
      switch (key) {
        case 'disable-all':
          this.disableAll = val;
          break;
        default:
          break;
      }
    });

    prefs.ready(() => {
      this.disableAll = Boolean(prefs.get('disable-all'));
    });
  }
}

export const createDNRHandler = () => new DNRRequestHandler();
