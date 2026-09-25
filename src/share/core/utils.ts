import { RULE_TYPE, TABLE_NAMES } from './constant';
import type { Rule } from './types';

export const IS_ANDROID = navigator.userAgent.includes('Android');
export const IS_FIREFOX = BROWSER_TYPE === 'firefox';
export const IS_CHROME = BROWSER_TYPE === 'chrome';

export const isValidArray = <T = any>(v: any): v is T[] =>
  Array.isArray(v) && v.length > 0;

export function trimNewLines(s: string) {
  return s.replace(/^[\s\n]+/, '').replace(/[\s\n]+$/, '');
}

export function getTableName(ruleType: RULE_TYPE): TABLE_NAMES {
  switch (ruleType) {
    case RULE_TYPE.CANCEL:
    case RULE_TYPE.REDIRECT:
      return TABLE_NAMES.request;
    case RULE_TYPE.MODIFY_SEND_HEADER:
      return TABLE_NAMES.sendHeader;
    case RULE_TYPE.MODIFY_RECV_HEADER:
    case RULE_TYPE.REDIRECT_AT_RESPONSE:
      return TABLE_NAMES.receiveHeader;
    case RULE_TYPE.MODIFY_RECV_BODY:
      return TABLE_NAMES.receiveBody;
    default:
      return TABLE_NAMES.request;
  }
}

export function isRedirectRule(ruleType: RULE_TYPE) {
  return (
    ruleType === RULE_TYPE.REDIRECT ||
    ruleType === RULE_TYPE.REDIRECT_AT_RESPONSE
  );
}

export function isModifyHeaderRule(ruleType: RULE_TYPE) {
  return (
    ruleType === RULE_TYPE.MODIFY_SEND_HEADER ||
    ruleType === RULE_TYPE.MODIFY_RECV_HEADER
  );
}

export function canAccess(url?: string) {
  if (!url) {
    return true;
  }
  // only http, https, file, extension allowed
  if (
    url.indexOf('http') !== 0 &&
    url.indexOf('file') !== 0 &&
    url.indexOf('ftp') !== 0
  ) {
    return false;
  }
  if (IS_CHROME && url.indexOf('https://chrome.google.com/webstore') === 0) {
    return false;
  }
  return true;
}

export function getDomain(url: string) {
  if (url.indexOf('file:') === 0) {
    return '';
  }
  const d = /.*?:\/*([^/:]+)/.exec(url);
  return d ? d[1] : '';
}

export function getGlobal() {
  if (typeof window !== 'undefined') {
    return window;
  }
  return globalThis;
}

export function isBackground() {
  if (typeof window === 'undefined') {
    return true;
  }
  return typeof window.IS_BACKGROUND !== 'undefined';
}

export function getVirtualKey(rule: Rule) {
  return `${getTableName(rule.ruleType)}-${rule.id}`;
}

export function parseVirtualKey(key: string) {
  const [table, id] = key.split('-');
  return {
    table: table as TABLE_NAMES,
    id: Number(id),
  };
}

export function sleep(ms: number) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}
