import { getBrowserVersion } from './browser';
import { IS_FIREFOX } from './build-inject-constant';
import {
  IS_MATCH,
  RULE_MATCH_TYPE,
  RULE_TYPE,
  TABLE_NAMES_ARR,
} from './constant';
import { compileCondition, matchCondition } from './header-matcher';
import type {
  BasicRule,
  InitdRule,
  RULE_ACTION_OBJ,
  Rule,
  RuleFilterOptions,
} from './types';
import { isBasicRule } from './types';
import { getDomain, isValidArray } from './utils';

export function isSupportHeaderMatch() {
  if (IS_FIREFOX) {
    return false;
  }
  const chromeVersion = getBrowserVersion();
  return chromeVersion >= 128;
}

export function detectRunner(rule: BasicRule): 'web_request' | 'dnr' {
  if (rule.forceRunner && rule.forceRunner !== 'auto') {
    if (rule.forceRunner === 'web_request' && ENABLE_WEB_REQUEST) {
      return 'web_request';
    }
    if (rule.forceRunner === 'dnr' && ENABLE_DNR) {
      return 'dnr';
    }
  }
  if (rule.isFunction) {
    return 'web_request';
  }
  if (rule.exclude) {
    return 'web_request';
  }
  if (rule.condition?.excludeRegex) {
    return 'web_request';
  }
  if (rule.ruleType === RULE_TYPE.MODIFY_RECV_BODY) {
    return 'web_request';
  }
  if (
    !isSupportHeaderMatch() &&
    (rule.condition?.responseHeaders ||
      rule.condition?.excludeResponseHeaders) &&
    ENABLE_WEB_REQUEST
  ) {
    return 'web_request';
  }
  return 'dnr';
}

export function initRule(
  rule: BasicRule,
  forceUseWebRequest = false,
): InitdRule {
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
      initd._func = new Function('val', 'detail', 'util', initd.code) as any;
    }
    // Init regexp
    if (rule.condition) {
      const {
        regex,
        excludeRegex,
        urlFilter,
        responseHeaders,
        excludeResponseHeaders,
      } = rule.condition;
      if (urlFilter) {
        initd._filter_reg = createUrlFilterRegex(urlFilter);
      }
      if (regex) {
        initd._reg = new RegExp(regex, 'g');
      }
      if (excludeRegex) {
        initd._exclude = new RegExp(excludeRegex);
      }

      if (responseHeaders || excludeResponseHeaders) {
        initd._response_headers_filter = compileCondition({
          responseHeaders,
          excludeResponseHeaders,
        });
      }
    } else {
      if (initd.matchType === 'regexp' && initd.pattern) {
        initd._reg = new RegExp(initd.pattern, 'g');
      }
      if (typeof initd.exclude === 'string' && initd.exclude.length > 0) {
        initd._exclude = new RegExp(initd.exclude);
      }
    }
  }
  return initd;
}

export function createExport(arr: { [key: string]: Array<Rule | InitdRule> }) {
  const result: { [key: string]: BasicRule[] } = {};
  Object.keys(arr).forEach(k => {
    result[k] = arr[k].map(e => convertToBasicRule(e));
  });
  return result;
}

export function convertToRule(rule: InitdRule | Rule): Rule {
  const item: any = { ...rule };
  delete item._re2;
  delete item._reg;
  delete item._filter_reg;
  delete item._func;
  delete item._v_key;
  delete item._runner;
  delete item._exclude;
  return item;
}

export function convertToBasicRule(
  rule: InitdRule | Rule | BasicRule,
): BasicRule {
  if (isBasicRule(rule)) {
    return rule;
  }
  const item = convertToRule(rule);
  delete (item as any).id;
  return item;
}

export function fromJson(str: string) {
  const list: { [key: string]: Rule[] } = JSON.parse(str);
  TABLE_NAMES_ARR.forEach(e => {
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

  s.isFunction =
    typeof s.isFunction === 'undefined' ? false : Boolean(s.isFunction);

  s.enable = typeof s.enable === 'undefined' ? true : Boolean(s.enable);

  if (
    (s.ruleType === 'modifySendHeader' ||
      s.ruleType === 'modifyReceiveHeader') &&
    !s.isFunction
  ) {
    if (!s.headers && typeof s.action === 'object') {
      const { name, value } = s.action as RULE_ACTION_OBJ;
      s.headers = {
        [name]: value,
      };
    }
    delete s.action;
  }

  if (typeof s.headers === 'object') {
    s.headers = Object.fromEntries(
      Object.entries(s.headers).map(([key, value]) => [
        key.toLowerCase(),
        value,
      ]),
    );
  }

  if (!s.condition) {
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
    if (s.exclude) {
      s.condition.excludeRegex = s.exclude;
    }
  }

  if (s.condition?.responseHeaders) {
    s.condition.responseHeaders = s.condition.responseHeaders.map(e => ({
      ...e,
      header: e.header.toLowerCase(),
    }));
  }
  if (s.condition?.excludeResponseHeaders) {
    s.condition.excludeResponseHeaders = s.condition.excludeResponseHeaders.map(
      e => ({
        ...e,
        header: e.header.toLowerCase(),
      }),
    );
  }

  delete s.matchType;
  delete s.action;
  delete s.pattern;
  delete s.exclude;

  return s;
}

export function createUrlFilterRegex(filter: string): RegExp {
  if (!filter) {
    return /.*/;
  }

  let leftAnchor = '';
  let rightAnchor = '';
  let pattern = filter;

  if (pattern.startsWith('||')) {
    leftAnchor = '||';
    pattern = pattern.slice(2);
  } else if (pattern.startsWith('|')) {
    leftAnchor = '|';
    pattern = pattern.slice(1);
  }

  if (pattern.endsWith('|') && !pattern.endsWith('||')) {
    rightAnchor = '|';
    pattern = pattern.slice(0, -1);
  }

  const SEPARATOR_END = '(?:$|[^a-zA-Z0-9_.%?#-])';
  const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  let body = '';
  for (let i = 0; i < pattern.length; i++) {
    const ch = pattern[i];
    if (ch === '*') {
      body += '.*';
    } else if (ch === '^') {
      body += SEPARATOR_END;
    } else {
      body += escapeRegex(ch);
    }
  }

  let regex = '';

  if (leftAnchor === '||') {
    regex = `^(?:[^/]*://)?(?:[^/]*\\.)?${body}`;
  } else if (leftAnchor === '|') {
    regex = `^${body}`;
  } else {
    regex = body;
  }

  if (rightAnchor === '|') {
    if (leftAnchor === '|') {
      regex += '(?=[^a-zA-Z0-9_.%?#-/:])';
    } else if (leftAnchor === '||') {
      regex += '(?=[^a-zA-Z0-9_.%?#-/:])';
    } else {
      regex += '$';
    }
  }

  return new RegExp(regex, 'i');
}

export function isMatchUrl(rule: InitdRule, url: string): IS_MATCH {
  let result = true;

  // new condition
  if (rule.condition) {
    const {
      url: condUrl,
      urlPrefix,
      domain,
      excludeDomain,
      excludeRegex,
      urlFilter,
      regex,
    } = rule.condition;
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
    if (urlFilter) {
      if (!rule._filter_reg) {
        rule._filter_reg = createUrlFilterRegex(urlFilter);
      }
      result = result && rule._filter_reg.test(url);
    }
    if (regex && !urlFilter) {
      if (detectRunner(rule) === 'dnr' && rule._re2 && ENABLE_DNR) {
        result = rule._re2.matches(url);
      } else {
        const reg = rule._reg || new RegExp(regex);
        reg.lastIndex = 0;
        result = result && reg.test(url);
      }
    }
    if (!result) {
      return IS_MATCH.NOT_MATCH;
    }
    if (isValidArray(excludeDomain) && excludeDomain.includes(urlDomain)) {
      return IS_MATCH.EXCLUDE;
    }
    if (excludeRegex) {
      const reg = rule._exclude || new RegExp(excludeRegex);
      reg.lastIndex = 0;
      if (reg.test(url)) {
        return IS_MATCH.EXCLUDE;
      }
    }
    return IS_MATCH.MATCH;
  }

  switch (rule.matchType) {
    case 'regexp': {
      const reg = rule._reg || new RegExp(rule.pattern || '');
      // _reg 可能带 g 标志，lastIndex 跨调用残留会导致结果翻转
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
    const excludeReg = rule._exclude;
    // 防御：用户传入的 pattern 若带 g 标志，lastIndex 会跨调用残留
    excludeReg.lastIndex = 0;
    return excludeReg.test(url) ? IS_MATCH.EXCLUDE : IS_MATCH.MATCH;
  }

  return IS_MATCH.MATCH;
}

export function isMatchRule(
  rule: InitdRule,
  options?: RuleFilterOptions,
): IS_MATCH {
  if (!options) {
    return IS_MATCH.MATCH;
  }

  const url = typeof options.url !== 'undefined' ? options.url : null;

  if (
    typeof options.runner !== 'undefined' &&
    rule._runner !== options.runner
  ) {
    return IS_MATCH.NOT_MATCH;
  }

  if (options.group && rule.group !== options.group) {
    return IS_MATCH.NOT_MATCH;
  }

  if (typeof options.id !== 'undefined') {
    if (Array.isArray(options.id)) {
      if (!options.id.includes(rule.id)) {
        return IS_MATCH.NOT_MATCH;
      }
    } else if (rule.id !== Number(options.id)) {
      return IS_MATCH.NOT_MATCH;
    }
  }

  if (options.name && rule.name !== options.name) {
    return IS_MATCH.NOT_MATCH;
  }

  if (typeof options.enable !== 'undefined' && rule.enable !== options.enable) {
    return IS_MATCH.NOT_MATCH;
  }

  if (typeof options.type !== 'undefined' && rule.ruleType !== options.type) {
    return IS_MATCH.NOT_MATCH;
  }

  if (
    options.method &&
    isValidArray(rule.condition?.method) &&
    !rule.condition.method.includes(options.method)
  ) {
    return IS_MATCH.NOT_MATCH;
  }

  // 排除方法：与 DNR 的 excludedRequestMethods 语义一致
  if (
    options.method &&
    isValidArray(rule.condition?.excludeMethod) &&
    rule.condition.excludeMethod.includes(options.method)
  ) {
    return IS_MATCH.EXCLUDE;
  }

  if (url !== null) {
    const res = isMatchUrl(rule, url);
    if (res !== IS_MATCH.MATCH) {
      return res;
    }
  }

  if (options.resourceType && rule.condition) {
    const { resourceTypes, excludeResourceTypes } = rule.condition;
    if (
      isValidArray(resourceTypes) &&
      !resourceTypes.includes(options.resourceType)
    ) {
      return IS_MATCH.NOT_MATCH;
    }
    if (
      isValidArray(excludeResourceTypes) &&
      excludeResourceTypes.includes(options.resourceType)
    ) {
      return IS_MATCH.EXCLUDE;
    }
  }

  if (options.responseHeaders && rule._response_headers_filter) {
    const res = matchCondition(
      rule._response_headers_filter,
      options.responseHeaders,
    );
    if (res !== IS_MATCH.MATCH) {
      return res;
    }
  }

  return IS_MATCH.MATCH;
}

/**
 * 按条件过滤规则列表（匹配逻辑与运行时一致）
 *
 * 注意：URL 匹配要求返回 IS_MATCH.MATCH，因此命中排除条件
 * （IS_MATCH.EXCLUDE）的规则不会出现在结果中。
 */
export function filter(
  fromRules: InitdRule[],
  options?: RuleFilterOptions,
): InitdRule[] {
  if (!options || typeof options !== 'object') {
    return Array.from(fromRules);
  }

  return fromRules.filter(
    rule => isMatchRule(rule, options) === IS_MATCH.MATCH,
  );
}
