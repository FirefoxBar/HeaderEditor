import { InitedRule, Rule, TABLE_NAMES, TinyRule, isTinyRule } from './var';

export function createExport(arr: { [key: string]: Array<Rule | InitedRule> }) {
  const result: { [key: string]: TinyRule[] } = {};
  // tslint:disable-next-line
  for (const k in arr) {
    result[k] = arr[k].map(e => convertToTinyRule(e));
  }
  return result;
}

export function convertToRule(rule: InitedRule | Rule): Rule {
  const item = { ...rule };
  delete item._reg;
  delete item._func;
  delete item._v_key;
  return item;
}

export function convertToTinyRule(rule: InitedRule | Rule | TinyRule): TinyRule {
  if (isTinyRule(rule)) {
    return rule;
  }
  const item = convertToRule(rule);
  delete item.id;
  return item;
}

export function fromJson(str: string) {
  const list: { [key: string]: Rule[] } = JSON.parse(str);
  TABLE_NAMES.forEach(e => {
    if (list[e]) {
      list[e].map(ee => {
        delete ee.id;
        return upgradeRuleFormat(ee);
      });
    }
  });
  return list;
}

export function upgradeRuleFormat(s: any) {
  if (typeof s.matchType === 'undefined') {
    s.matchType = s.type;
    delete s.type;
  }
  if (typeof s.isFunction === 'undefined') {
    s.isFunction = false;
  } else {
    s.isFunction = s.isFunction ? true : false;
  }
  if (typeof s.enable === 'undefined') {
    s.enable = true;
  } else {
    s.enable = s.enable ? true : false;
  }
  if ((s.ruleType === 'modifySendHeader' || s.ruleType === 'modifyReceiveHeader') && !s.isFunction) {
    s.action.name = s.action.name.toLowerCase();
  }
  return s;
}
