import { RULE_MATCH_TYPE, RULE_TYPE } from '@/share/core/constant';
import type { BasicRule } from '@/share/core/types';
import { isValidArray, t } from '@/share/core/utils';

export interface RuleInput extends BasicRule {
  editHeader?: Array<{ name: string; value: string }>;
  editMatchType?: RULE_MATCH_TYPE[];
  editExcludeType?: Array<'method' | 'regex' | 'domain' | 'resourceType'>;
}

export const EMPTY_RULE: BasicRule = {
  enable: true,
  group: t('ungrouped'),
  name: '',
  ruleType: RULE_TYPE.CANCEL,
  isFunction: false,
  code: '',
  action: 'cancel',
};

export const EMPTY_ARR = [];

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
  return res;
}

export function getRuleFromInput(input: RuleInput): BasicRule {
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
    if (res.editMatchType?.includes(RULE_MATCH_TYPE.ALL)) {
      res.condition.all = true;
    }
  }

  delete res.editMatchType;
  delete res.editExcludeType;
  return res;
}
