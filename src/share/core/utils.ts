import browser from 'webextension-polyfill';
import { RULE_TYPE, TABLE_NAMES } from './constant';
import { Rule } from './types';

export const IS_ANDROID = navigator.userAgent.includes('Android');
export const IS_CHROME = /Chrome\/(\d+)\.(\d+)/.test(navigator.userAgent);
export const CHROME_VERSION = IS_CHROME
  ? (() => {
    const a = navigator.userAgent.match(/Chrome\/(\d+)\.(\d+)/);
    return a ? parseFloat(`${a[1]}.${a[2]}`) : 0;
  })()
  : 0;
export const IS_FIREFOX = !IS_CHROME;
export const FIREFOX_VERSION = IS_FIREFOX
  ? (() => {
    const a = navigator.userAgent.match(/Firefox\/(\d+)\.(\d+)/);
    return a ? parseFloat(`${a[1]}.${a[2]}`) : 0;
  })()
  : 0;

export const IS_SUPPORT_STREAM_FILTER =
  ENABLE_WEB_REQUEST && ENABLE_EVAL && typeof browser.webRequest?.filterResponseData === 'function';

export const isValidArray = <T = any>(v: any): v is T[] => Array.isArray(v) && v.length > 0;
// Get Active Tab
export async function getActiveTab() {
  const tabs = await browser.tabs.query({ currentWindow: true, active: true });
  return tabs[0];
}
export function trimNewLines(s: string) {
  return s.replace(/^[\s\n]+/, '').replace(/[\s\n]+$/, '');
}

interface FetchUrlParam {
  post?: any;
  query?: any;
  url: string;
  header?: { [key: string]: string };
}
export async function fetchUrl(param: FetchUrlParam) {
  const fetchParam: RequestInit = {
    method: param.post ? 'POST' : 'GET',
  };
  const headers: Record<string, string> = {};
  let { url } = param;
  if (param.query) {
    url += `?${new URLSearchParams(param.query).toString()}`;
  }
  if (fetchParam.method === 'POST') {
    // 遍历一下，查找是否有File
    let hasFile = false;
    for (const name in param.post) {
      if (param.post[name] instanceof File) {
        hasFile = true;
        break;
      }
    }
    if (hasFile) {
      const formBody = new FormData();
      for (const name in param.post) {
        if (param.post[name] instanceof File) {
          formBody.append(name, param.post[name], param.post[name].name);
        } else {
          formBody.append(name, param.post[name]);
        }
      }
      fetchParam.body = formBody;
    } else {
      headers['Content-Type'] = 'application/x-www-form-urlencoded';
      fetchParam.body = new URLSearchParams(param.post).toString();
    }
  }
  if (param.header) {
    Object.keys(param.header).forEach((name) => {
      headers[name] = param.header![name];
    });
  }
  fetchParam.headers = headers;
  const res = await fetch(url, fetchParam);
  return res.text();
}

export function getTableName(ruleType: RULE_TYPE): TABLE_NAMES {
  switch (ruleType) {
    case RULE_TYPE.CANCEL:
    case RULE_TYPE.REDIRECT:
      return TABLE_NAMES.request;
    case RULE_TYPE.MODIFY_SEND_HEADER:
      return TABLE_NAMES.sendHeader;
    case RULE_TYPE.MODIFY_RECV_HEADER:
      return TABLE_NAMES.receiveHeader;
    case RULE_TYPE.MODIFY_RECV_BODY:
      return TABLE_NAMES.receiveBody;
    default:
      return TABLE_NAMES.request;
  }
}

export function canAccess(url?: string) {
  if (!url) {
    return true;
  }
  // only http, https, file, extension allowed
  if (
    url.indexOf('http') !== 0 &&
    url.indexOf('file') !== 0 &&
    url.indexOf('moz-extension') !== 0 &&
    url.indexOf('chrome-extension') !== 0 &&
    url.indexOf('ftp') !== 0
  ) {
    return false;
  }
  // other extensions can't be styled
  if (
    (url.indexOf('moz-extension') === 0 || url.indexOf('chrome-extension') === 0) &&
    url.indexOf(browser.runtime.getURL('')) !== 0
  ) {
    return false;
  }
  if (IS_CHROME && url.indexOf('https://chrome.google.com/webstore') === 0) {
    return false;
  }
  return true;
}

export function t(key: string, params?: any, defaultValue?: string) {
  const s = browser.i18n.getMessage(key, params);
  if (s) {
    return s;
  }
  if (typeof defaultValue !== 'undefined') {
    return defaultValue;
  }
  return key;
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
