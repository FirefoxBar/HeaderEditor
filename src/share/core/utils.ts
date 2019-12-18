import dateFormat from 'dateformat';
import { browser, Tabs } from 'webextension-polyfill-ts';

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

export const IS_SUPPORT_STREAM_FILTER = typeof browser.webRequest.filterResponseData === 'function';

export const TABLE_NAMES = ['request', 'sendHeader', 'receiveHeader', 'receiveBody'];
export type TABLE_NAMES_TYPE = 'request' | 'sendHeader' | 'receiveHeader' | 'receiveBody';
export type RULE_TYPE = 'cancel' | 'redirect' | 'modifySendHeader' | 'modifyReceiveHeader' | 'modifyReceiveBody';

export function getExportName(additional?: string) {
  const date = dateFormat(new Date(), 'isoUtcDateTime').replace(/\:/g, '-');
  return `HE_${date}${additional ? '_' + additional : ''}.json`;
}
// Get Active Tab
export function getActiveTab(): Promise<Tabs.Tab> {
  return new Promise(resolve => {
    browser.tabs
      .query({ currentWindow: true, active: true })
      .then(tabs => tabs[0])
      .then(resolve);
  });
}
export function trimNewLines(s: string) {
  return s.replace(/^[\s\n]+/, '').replace(/[\s\n]+$/, '');
}

interface FetchUrlParam {
  post?: any;
  query: any;
  url: string;
  header: { [key: string]: string };
}
export function fetchUrl(param: FetchUrlParam): Promise<string> {
  return new Promise((resolve, reject) => {
    const fetchParam: RequestInit = {
      method: param.post ? 'POST' : 'GET',
    };
    const headers: Record<string, string> = {};
    let url = param.url;
    if (param.query) {
      url += '?' + new URLSearchParams(param.query).toString();
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
      // tslint:disable-next-line
      for (const name in param.header) {
        headers[name] = param.header[name];
      }
    }
    fetchParam.headers = headers;
    fetch(url, fetchParam)
      .then(r => r.text())
      .then(resolve)
      .catch(reject);
  });
}

export function getTableName(ruleType: RULE_TYPE) {
  if (ruleType === 'cancel' || ruleType === 'redirect') {
    return 'request';
  }
  if (ruleType === 'modifySendHeader') {
    return 'sendHeader';
  }
  if (ruleType === 'modifyReceiveHeader') {
    return 'receiveHeader';
  }
  if (ruleType === 'modifyReceiveBody') {
    return 'receiveBody';
  }
  return '';
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
    url.indexOf(browser.extension.getURL('')) !== 0
  ) {
    return false;
  }
  if (IS_CHROME && url.indexOf('https://chrome.google.com/webstore') === 0) {
    return false;
  }
  return true;
}

export function t(key: string, params?: any) {
  const s = browser.i18n.getMessage(key, params);
  return s || key;
}

export function getDomain(url: string) {
  if (url.indexOf('file:') === 0) {
    return '';
  }
  const d = /.*?:\/*([^\/:]+)/.exec(url);
  return d ? d[1] : null;
}

export function createHeaderListener(type: string) {
  const result = ['blocking'];
  result.push(type);
  // @ts-ignore
  if (
    IS_CHROME &&
    chrome.webRequest.OnBeforeSendHeadersOptions &&
    chrome.webRequest.OnBeforeSendHeadersOptions.hasOwnProperty('EXTRA_HEADERS')
  ) {
    result.push('extraHeaders');
  }
  return result;
}
