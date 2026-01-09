import type { DeclarativeNetRequest } from 'webextension-polyfill/namespaces/declarativeNetRequest';
import {
  ALL_RESOURCE_TYPES,
  RULE_MATCH_TYPE,
  RULE_TYPE,
  TABLE_NAMES,
} from '@/share/core/constant';
import type { RULE_ACTION_OBJ, Rule } from '@/share/core/types';
import { getTableName, isValidArray } from '@/share/core/utils';
import { parseJSONPath } from '../utils';

export type DNRRule = DeclarativeNetRequest.Rule;

export function createDNR(rule: Rule, id: number) {
  const res: DNRRule = {
    id,
    action: {
      type: 'upgradeScheme',
    },
    condition: {
      // All resource types
      resourceTypes: ALL_RESOURCE_TYPES,
    },
  };

  let isRegex = false;
  if (rule.condition) {
    const {
      all,
      url,
      urlPrefix,
      domain,
      excludeDomain,
      regex,
      resourceTypes,
      excludeResourceTypes,
      excludeMethod,
      method,
    } = rule.condition;
    res.condition.requestDomains = domain;
    // 只能指定 urlFilter 或 regexFilter 中的一项。
    if (regex) {
      res.condition.regexFilter = regex;
      isRegex = true;
    } else if (all) {
      res.condition.urlFilter = '*';
    } else if (url) {
      res.condition.urlFilter = url;
    } else if (urlPrefix) {
      res.condition.urlFilter = `${urlPrefix}*`;
    }
    if (isValidArray(excludeDomain)) {
      res.condition.excludedRequestDomains = excludeDomain;
    }
    // 应仅指定 requestMethods 和 excludedRequestMethods 中的一项
    if (isValidArray(method)) {
      res.condition.requestMethods = method;
    }
    if (isValidArray(excludeMethod)) {
      delete res.condition.requestMethods;
      res.condition.excludedRequestMethods = excludeMethod;
    }
    // 应仅指定 resourceTypes 和 excludedResourceTypes 中的一项
    if (isValidArray(resourceTypes)) {
      res.condition.resourceTypes = resourceTypes;
    }
    if (isValidArray(excludeResourceTypes)) {
      delete res.condition.resourceTypes;
      res.condition.excludedResourceTypes = excludeResourceTypes;
    }
  } else {
    // match condition
    switch (rule.matchType) {
      case RULE_MATCH_TYPE.DOMAIN:
        if (rule.pattern) {
          res.condition.requestDomains = [rule.pattern];
        }
        break;
      case RULE_MATCH_TYPE.URL:
        res.condition.urlFilter = rule.pattern;
        break;
      case RULE_MATCH_TYPE.ALL:
        res.condition.urlFilter = '*';
        break;
      case RULE_MATCH_TYPE.PREFIX:
        res.condition.urlFilter = `${rule.pattern}*`;
        break;
      case RULE_MATCH_TYPE.REGEXP:
        isRegex = true;
        res.condition.regexFilter = rule.pattern;
        break;
      default:
        break;
    }
  }

  if (rule.ruleType === RULE_TYPE.CANCEL) {
    res.action.type = 'block';
  }
  if (rule.ruleType === RULE_TYPE.REDIRECT) {
    res.action.type = 'redirect';
    if (isRegex) {
      res.action.redirect = {
        regexSubstitution: parseJSONPath(String(rule.to)).replace(
          /\$(\d+)/g,
          '\\$1',
        ),
      };
    } else {
      res.action.redirect = {
        url: parseJSONPath(rule.to || ''),
      };
    }
  }

  const createHeaderItem = (
    header: string,
    value: any,
  ): DeclarativeNetRequest.RuleActionResponseHeadersItemType => {
    if (
      value === '_header_editor_remove_' ||
      value === '' ||
      value === null ||
      typeof value === 'undefined'
    ) {
      return {
        header,
        operation: 'remove',
      };
    }
    return {
      header,
      operation: 'set',
      value: parseJSONPath(value),
    };
  };

  if (
    [RULE_TYPE.MODIFY_SEND_HEADER, RULE_TYPE.MODIFY_RECV_HEADER].includes(
      rule.ruleType,
    )
  ) {
    res.action.type = 'modifyHeaders';
    const key =
      rule.ruleType === RULE_TYPE.MODIFY_SEND_HEADER
        ? 'requestHeaders'
        : 'responseHeaders';
    if (rule.headers) {
      res.action[key] = Object.keys(rule.headers).map(key =>
        createHeaderItem(key, parseJSONPath(rule.headers![key])),
      );
    } else if (typeof rule.action === 'object') {
      const action = rule.action as RULE_ACTION_OBJ;
      res.action[key] = [
        createHeaderItem(action.name, parseJSONPath(action.value)),
      ];
    }
  }

  if (IS_DEV) {
    console.log('create dnr rule', rule, res);
  }

  return res;
}

export function getRuleId(
  id: number,
  table?: TABLE_NAMES,
  ruleType?: RULE_TYPE,
) {
  const list = {
    [TABLE_NAMES.request]: 0,
    [TABLE_NAMES.sendHeader]: 100000,
    [TABLE_NAMES.receiveHeader]: 200000,
    [TABLE_NAMES.receiveBody]: 300000,
  };

  const t = table || getTableName(ruleType || RULE_TYPE.REDIRECT);

  return Number(id) + list[t];
}
