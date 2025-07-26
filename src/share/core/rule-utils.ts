import { getDomain, isValidArray } from './utils';
import { isBasicRule } from './types';
import { IS_MATCH, RULE_MATCH_TYPE, TABLE_NAMES_ARR } from './constant';
import type { InitdRule, Rule, BasicRule, RULE_ACTION_OBJ } from './types';

export function detectRunner(rule: BasicRule): 'web_request' | 'dnr' {
  if (rule.isFunction) {
    return 'web_request';
  }
  if (rule.exclude) {
    return 'web_request';
  }
  if (rule.condition?.excludeRegex) {
    return 'web_request';
  }
  return 'dnr';
}

export function initRule(rule: BasicRule, forceUseWebRequest = false): InitdRule {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const initd: InitdRule = { ...rule } as InitdRule;
  initd._runner = detectRunner(rule);
  // DNR not enable, force to web_request
  if (!ENABLE_DNR && initd._runner === 'dnr') {
    initd._runner = 'web_request';
  }
  if (initd._runner === 'web_request' || forceUseWebRequest) {
    if (initd.isFunction && ENABLE_EVAL) {
      // eslint-disable-next-line no-new-func
      initd._func = new Function('val', 'detail', initd.code) as any;
    }
    // Init regexp
    if (initd.condition?.regex) {
      initd._reg = new RegExp(initd.condition.regex, 'g');
    }
    if (initd.matchType === 'regexp' && initd.pattern) {
      initd._reg = new RegExp(initd.pattern, 'g');
    }
    if (initd.condition?.excludeRegex) {
      initd._exclude = new RegExp(initd.condition.excludeRegex);
    }
    if (typeof initd.exclude === 'string' && initd.exclude.length > 0) {
      initd._exclude = new RegExp(initd.exclude);
    }
  }
  return initd;
}

export function createExport(arr: { [key: string]: Array<Rule | InitdRule> }) {
  const result: { [key: string]: BasicRule[] } = {};
  Object.keys(arr).forEach((k) => {
    result[k] = arr[k].map((e) => convertToBasicRule(e));
  });
  return result;
}

export function convertToRule(rule: InitdRule | Rule): Rule {
  const item: any = { ...rule };
  delete item._reg;
  delete item._func;
  delete item._v_key;
  delete item._runner;
  return item;
}

export function convertToBasicRule(rule: InitdRule | Rule | BasicRule): BasicRule {
  if (isBasicRule(rule)) {
    return rule;
  }
  const item = convertToRule(rule);
  delete (item as any).id;
  return item;
}

export function fromJson(str: string) {
  const list: { [key: string]: Rule[] } = JSON.parse(str);
  TABLE_NAMES_ARR.forEach((e) => {
    if (list[e]) {
      list[e].map((ee: BasicRule) => {
        delete (ee as any).id;
        return upgradeRuleFormat(ee);
      });
    }
  });
  return list;
}

interface OldRule extends BasicRule {
  type?: RULE_MATCH_TYPE;
}

export function upgradeRuleFormat(s: OldRule) {
  if (typeof s.matchType === 'undefined' && s.type) {
    s.matchType = s.type;
    delete s.type;
  }

  s.isFunction = typeof s.isFunction === 'undefined' ? false : Boolean(s.isFunction);

  s.enable = typeof s.enable === 'undefined' ? true : Boolean(s.enable);

  if ((s.ruleType === 'modifySendHeader' || s.ruleType === 'modifyReceiveHeader') && !s.isFunction) {
    if (!s.headers && s.action) {
      const { name, value } = s.action as RULE_ACTION_OBJ;
      s.headers = {
        [name]: value,
      };
    }
    if (typeof s.headers === 'object') {
      s.headers = Object.fromEntries(Object.entries(s.headers).map(([key, value]) => [key.toLowerCase(), value]));
    }
  }

  if (!s.condition && s.matchType) {
    s.condition = {};
    switch (s.matchType) {
      case RULE_MATCH_TYPE.ALL:
        s.condition.all = true;
        break;
      case RULE_MATCH_TYPE.DOMAIN:
        if (s.pattern) {
          s.condition.domain = [s.pattern];
        }
        break;
      case RULE_MATCH_TYPE.PREFIX:
        s.condition.urlPrefix = s.pattern;
        break;
      case RULE_MATCH_TYPE.REGEXP:
        s.condition.regex = s.pattern;
        break;
      case RULE_MATCH_TYPE.URL:
        s.condition.url = s.pattern;
        break;
      default:
        break;
    }
    delete s.pattern;
    delete s.matchType;
  }

  return s;
}

export function isMatchUrl(rule: InitdRule, url: string): IS_MATCH {
  let result = true;

  // new condition
  if (rule.condition) {
    const { url: condUrl, urlPrefix, domain, excludeDomain, excludeRegex, regex } = rule.condition;
    if (condUrl) {
      result = result && url === condUrl;
    }
    if (urlPrefix) {
      result = result && url.indexOf(urlPrefix) === 0;
    }
    const urlDomain = getDomain(url);
    if (isValidArray(domain)) {
      result = result && domain.includes(urlDomain);
    }
    if (regex) {
      const reg = rule._reg || new RegExp(regex, 'g');
      reg.lastIndex = 0;
      result = result && reg.test(url);
    }
    if (!result) {
      return IS_MATCH.NOT_MATCH;
    }
    if (isValidArray(excludeDomain) && excludeDomain.includes(urlDomain)) {
      return IS_MATCH.MATCH_BUT_EXCLUDE;
    }
    if (excludeRegex) {
      const reg = rule._exclude || new RegExp(excludeRegex, 'g');
      reg.lastIndex = 0;
      if (!reg.test(url)) {
        return IS_MATCH.MATCH_BUT_EXCLUDE;
      }
    }
    return IS_MATCH.MATCH;
  }

  switch (rule.matchType) {
    case 'regexp': {
      const reg = rule._reg;
      reg.lastIndex = 0;
      result = reg.test(url);
      break;
    }
    case 'prefix':
      result = rule.pattern ? url.indexOf(rule.pattern) === 0 : false;
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
