import { t } from '@/share/core/browser';
import { RULE_MATCH_TYPE, RULE_TYPE } from '@/share/core/constant';
import type { BasicRule, HeaderMatchInfo } from '@/share/core/types';
import { isValidArray } from '@/share/core/utils';

export interface RuleInput extends BasicRule {
  editHeader?: Array<{ name: string; value: string }>;
  editMatchType?: RULE_MATCH_TYPE[];
  editExcludeType?: Array<
    'method' | 'regex' | 'domain' | 'resourceType' | 'responseHeaders'
  >;
}

export const EMPTY_RULE: BasicRule = {
  enable: true,
  group: t('ungrouped'),
  name: '',
  ruleType: RULE_TYPE.CANCEL,
  isFunction: false,
  code: '',
  forceRunner: 'auto',
};

export const EMPTY_ARR = [];

export const isAllowFilterResponseHeaders = (ruleType: RULE_TYPE) => {
  return [
    RULE_TYPE.REDIRECT_AT_RESPONSE,
    RULE_TYPE.MODIFY_RECV_HEADER,
    RULE_TYPE.MODIFY_RECV_BODY,
  ].includes(ruleType);
};

export function getInput(rule: BasicRule) {
  const res: RuleInput = { ...rule };
  if (res.headers) {
    res.editHeader = Object.entries(res.headers).map(([name, value]) => ({
      name,
      value,
    }));
    delete res.headers;
  }
  if (res.condition) {
    res.editMatchType = [];
    res.editExcludeType = [];
    const {
      all,
      url,
      urlPrefix,
      method,
      domain,
      regex,
      resourceTypes,
      excludeDomain,
      excludeRegex,
      excludeResourceTypes,
      urlFilter,
    } = res.condition;
    if (all) {
      res.editMatchType.push(RULE_MATCH_TYPE.ALL);
    }
    if (url) {
      res.editMatchType.push(RULE_MATCH_TYPE.URL);
    }
    if (urlPrefix) {
      res.editMatchType.push(RULE_MATCH_TYPE.PREFIX);
    }
    if (method) {
      res.editMatchType.push(RULE_MATCH_TYPE.METHOD);
    }
    if (isValidArray(domain)) {
      res.editMatchType.push(RULE_MATCH_TYPE.DOMAIN);
    }
    if (urlFilter) {
      res.editMatchType.push(RULE_MATCH_TYPE.URL_FILTER);
    }
    if (regex) {
      res.editMatchType.push(RULE_MATCH_TYPE.REGEXP);
    }
    if (resourceTypes) {
      res.editMatchType.push(RULE_MATCH_TYPE.RESOURCE_TYPE);
    }
    if (isValidArray(excludeDomain)) {
      res.editExcludeType.push('domain');
    }
    if (excludeRegex) {
      res.editExcludeType.push('regex');
    }
    if (excludeResourceTypes) {
      res.editExcludeType.push('resourceType');
    }
  }
  if (res.encoding) {
    res.encoding = res.encoding.toLowerCase();
  }
  return res;
}

export function getRuleFromInput(input: RuleInput): BasicRule {
  const { editMatchType = [], editExcludeType = [], condition = {} } = input;
  const res = { ...input };
  if (
    res.ruleType === RULE_TYPE.MODIFY_SEND_HEADER ||
    res.ruleType === RULE_TYPE.MODIFY_RECV_HEADER ||
    res.ruleType === RULE_TYPE.MODIFY_RECV_BODY
  ) {
    if (Array.isArray(res.editHeader)) {
      res.headers = Object.fromEntries(
        res.editHeader.filter(x => Boolean(x.name)).map(x => [x.name, x.value]),
      );
    }
    delete res.editHeader;
  }

  if (!res.condition) {
    res.condition = {};
  }

  if (editMatchType.includes(RULE_MATCH_TYPE.ALL)) {
    res.condition.all = true;
  }

  if (
    editMatchType.includes(RULE_MATCH_TYPE.URL_FILTER) &&
    condition.urlFilter
  ) {
    res.condition.urlFilter = condition.urlFilter;
    delete res.condition.url;
    delete res.condition.urlPrefix;
    delete res.condition.all;
    // urlFilter 不能和 regex 共存
    delete res.condition.regex;
  }

  const filterHeaderMatchInfo = (info?: HeaderMatchInfo[]) => {
    if (!info) {
      return undefined;
    }
    const h = info.filter(x => x.header);
    h.forEach(x => {
      if (x.values) {
        x.values = x.values.filter(x => Boolean(x));
        if (!isValidArray(x.values)) {
          delete x.values;
        }
      }
      if (x.excludedValues) {
        x.excludedValues = x.excludedValues.filter(x => Boolean(x));
        if (!isValidArray(x.excludedValues)) {
          delete x.excludedValues;
        }
      }
    });
    if (!isValidArray(h)) {
      return undefined;
    }
    return h;
  };
  if (
    editMatchType.includes(RULE_MATCH_TYPE.RESPONSE_HEADERS) &&
    isAllowFilterResponseHeaders(res.ruleType)
  ) {
    res.condition.responseHeaders = filterHeaderMatchInfo(
      condition.responseHeaders,
    );
  }
  if (
    editExcludeType.includes('responseHeaders') &&
    isAllowFilterResponseHeaders(res.ruleType)
  ) {
    res.condition.excludeResponseHeaders = filterHeaderMatchInfo(
      condition.excludeResponseHeaders,
    );
  }

  if (res.encoding) {
    res.encoding = res.encoding.toLowerCase();
  }

  delete res.action;
  delete res.editMatchType;
  delete res.editExcludeType;
  return res;
}
