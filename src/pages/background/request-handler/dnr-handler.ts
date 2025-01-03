/* eslint-disable @typescript-eslint/member-ordering */
import browser from 'webextension-polyfill';
import { RULE_MATCH_TYPE, RULE_TYPE } from '@/share/core/constant';
import emitter from '@/share/core/emitter';
import { prefs } from '@/share/core/prefs';
import { detectRunner } from '@/share/core/rule-utils';
import type { Rule, RULE_ACTION_OBJ } from '@/share/core/types';
import { getVirtualKey } from '@/share/core/utils';
import rules from '../core/rules';
import type { DeclarativeNetRequest } from 'webextension-polyfill/namespaces/declarativeNetRequest';

type DNRRule = DeclarativeNetRequest.Rule;

function createDNR(rule: Rule, id: number) {
  const res: DNRRule = {
    id,
    action: {
      type: 'upgradeScheme',
    },
    condition: {},
  };

  // match condition
  if (rule.matchType === RULE_MATCH_TYPE.DOMAIN) {
    res.condition.requestDomains = [
      rule.pattern,
    ];
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
    res.action.redirect = {
      regexSubstitution: rule.to,
    };
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

  return res;
}

class DNRRequestHandler {
  private lastRuleId = 0;
  private ruleIdMap: Map<string, number> = new Map();
  private _disableAll = false;

  constructor() {
    this.initRules();
    this.initHook();
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

  private clearRules() {
    const ids = Array.from(this.ruleIdMap.values());
    browser.declarativeNetRequest.updateSessionRules({
      removeRuleIds: ids,
    });
    this.ruleIdMap.clear();
  }

  private initRules() {
    const v = Object.values(rules.getAll());

    if (v.some((x) => x === null)) {
      // rule not ready
      setTimeout(() => this.initRules());
      return;
    }

    const allRules = v.reduce((a, b) => [...a!, ...b!], []) || [];
    const addRules: DNRRule[] = [];
    allRules.forEach((rule) => {
      if (rule._runner !== 'dnr') {
        return;
      }
      const newRuleId = this.lastRuleId++;
      this.ruleIdMap.set(getVirtualKey(rule), newRuleId);
      addRules.push(createDNR(rule, newRuleId));
    });
    if (addRules.length > 0) {
      browser.declarativeNetRequest.updateSessionRules({
        addRules,
      });
    }
  }

  private initHook() {
    emitter.on(emitter.INNER_RULE_REMOVE, ({ table, id }) => {
      const old = this.ruleIdMap.get(`${table}-${id}`);
      if (typeof old === 'number') {
        browser.declarativeNetRequest.updateSessionRules({
          removeRuleIds: [old],
        });
      }
    });

    emitter.on(emitter.INNER_RULE_UPDATE, ({ from, to }) => {
      const old = this.ruleIdMap.get(getVirtualKey(from));
      const command: DeclarativeNetRequest.UpdateSessionRulesOptionsType = {
        removeRuleIds: [],
        addRules: [],
      };
      if (typeof old === 'number') {
        command.removeRuleIds!.push(old);
      }
      // detect new rule is DNR or not
      if (detectRunner(to) === 'dnr') {
        const newRuleId = this.lastRuleId++;
        this.ruleIdMap.set(getVirtualKey(to), newRuleId);
        command.addRules!.push(createDNR(to, newRuleId));
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
