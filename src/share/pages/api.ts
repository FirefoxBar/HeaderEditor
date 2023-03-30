import notify from '@/share/core/notify';
import type { Rule, BasicRule } from '@/share/core/types';
import { isBasicRule } from '@/share/core/types';
import { APIs } from '@/share/core/constant';
import { convertToRule } from '../core/rule-utils';
import { TABLE_NAMES, TABLE_NAMES_ARR } from '../core/constant';
import type { RuleFilterOptions } from '../core/types';

/**
 * Background API封装
 */
const Api = {
  openURL(url: string) {
    return notify.background({
      method: APIs.OPEN_URL,
      url,
    });
  },
  updateCache(type: TABLE_NAMES | 'all') {
    return notify.background({
      method: APIs.UPDATE_CACHE,
      type,
    });
  },
  getRules(type: TABLE_NAMES, options?: RuleFilterOptions): Promise<Rule[]> {
    return notify.background({
      method: APIs.GET_RULES,
      type,
      options,
    });
  },
  getAllRules(): Promise<{ [x: string]: Rule[] }> {
    return Promise.all(TABLE_NAMES_ARR.map((k) => this.getRules(k))).then((res) => {
      const result: any = {};
      res.forEach((it, index) => {
        result[TABLE_NAMES_ARR[index]] = it;
      });
      return result;
    });
  },
  saveRule(rule: Rule | BasicRule) {
    return notify.background({
      method: APIs.SAVE_RULE,
      rule: isBasicRule(rule) ? rule : convertToRule(rule),
    });
  },
  removeRule(table: TABLE_NAMES, id: number) {
    return notify.background({
      method: APIs.DELETE_RULE,
      type: table,
      id,
    });
  },
  setPrefs(key: string, value: any) {
    return notify.background({
      method: APIs.SET_PREFS,
      key,
      value,
    });
  },
};

export default Api;
