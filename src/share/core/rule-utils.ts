import { getDomain } from './utils';
import { isBasicRule } from './types';
import { IS_MATCH, TABLE_NAMES_ARR } from './constant';
import type { InitdRule, Rule, BasicRule } from './types';

export function initRule(rule: Rule): InitdRule {
  const inited: any = { ...rule };
  if (inited.isFunction) {
    // eslint-disable-next-line no-new-func
    inited._func = new Function('val', 'detail', inited.code);
  }
  // Init regexp
  if (inited.matchType === 'regexp') {
    inited._reg = new RegExp(inited.pattern, 'g');
  }
  if (typeof inited.exclude === 'string' && inited.exclude.length > 0) {
    inited._exclude = new RegExp(inited.exclude);
  }
  return inited;
}

export function createExport(arr: { [key: string]: Array<Rule | InitdRule> }) {
  const result: { [key: string]: BasicRule[] } = {};
  Object.keys(arr).forEach((k) => {
    result[k] = arr[k].map((e) => convertToBasicRule(e));
  });
  return result;
}

export function convertToRule(rule: InitdRule | Rule): Rule {
  const item = { ...rule };
  delete item._reg;
  delete item._func;
  delete item._v_key;
  return item;
}

export function convertToBasicRule(rule: InitdRule | Rule | BasicRule): BasicRule {
  if (isBasicRule(rule)) {
    return rule;
  }
  const item = convertToRule(rule);
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  delete item.id;
  return item;
}

export function fromJson(str: string) {
  const list: { [key: string]: Rule[] } = JSON.parse(str);
  TABLE_NAMES_ARR.forEach((e) => {
    if (list[e]) {
      list[e].map((ee) => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
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
    s.isFunction = !!s.isFunction;
  }
  if (typeof s.enable === 'undefined') {
    s.enable = true;
  } else {
    s.enable = !!s.enable;
  }
  if ((s.ruleType === 'modifySendHeader' || s.ruleType === 'modifyReceiveHeader') && !s.isFunction) {
    s.action.name = s.action.name.toLowerCase();
  }
  return s;
}

export function isMatchUrl(rule: InitdRule, url: string): IS_MATCH {
  let result = false;
  switch (rule.matchType) {
    case 'all':
      result = true;
      break;
    case 'regexp':
      rule._reg.lastIndex = 0;
      result = rule._reg.test(url);
      break;
    case 'prefix':
      result = url.indexOf(rule.pattern) === 0;
      break;
    case 'domain':
      result = getDomain(url) === rule.pattern;
      break;
    case 'url':
      result = url === rule.pattern;
      break;
    default:
      break;
  }
  if (!result) {
    return IS_MATCH.NOT_MATCH;
  }

  if (rule._exclude) {
    return rule._exclude.test(url) ? IS_MATCH.MATCH_BUT_EXCLUDE : IS_MATCH.MATCH;
  }

  return IS_MATCH.MATCH;
}
