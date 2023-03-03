import browser from 'webextension-polyfill';
import { convertToRule } from './ruleUtils';
import { APIs, isTinyRule, Rule, TABLE_NAMES, TABLE_NAMES_TYPE, TinyRule } from './var';

/**
 * Background API封装
 */
class BackgroundAPI {
  openURL(url: string) {
    return browser.runtime.sendMessage({
      method: APIs.OPEN_URL,
      url,
    });
  }
  updateCache(type: 'request' | 'sendHeader' | 'receiveHeader' | 'receiveBody' | 'all') {
    return browser.runtime.sendMessage({
      method: APIs.UPDATE_CACHE,
      type,
    });
  }
  getRules(type: TABLE_NAMES_TYPE, options?: any) {
    return browser.runtime.sendMessage({
      method: APIs.GET_RULES,
      type,
      options,
    });
  }
  getAllRules(): Promise<{ [x: string]: Rule[] }> {
    return Promise.all(TABLE_NAMES.map((k) => this.getRules(k))).then((res) => {
      const result: any = {};
      res.forEach((it, index) => {
        result[TABLE_NAMES[index]] = it;
      });
      return result;
    });
  }
  saveRule(rule: Rule | TinyRule) {
    return browser.runtime.sendMessage({
      method: APIs.SAVE_RULE,
      rule: isTinyRule(rule) ? rule : convertToRule(rule),
    });
  }
  removeRule(table: TABLE_NAMES_TYPE, id: number) {
    return browser.runtime.sendMessage({
      method: APIs.DELETE_RULE,
      type: table,
      id,
    });
  }
  setPrefs(key: string, value: any) {
    return browser.runtime.sendMessage({
      method: APIs.SET_PREFS,
      key,
      value,
    });
  }
}

const Api = new BackgroundAPI();

export default Api;
