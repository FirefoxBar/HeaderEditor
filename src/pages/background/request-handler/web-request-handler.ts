import { last } from 'lodash-es';
import browser, { type WebRequest } from 'webextension-polyfill';
import { RULE_TYPE, TABLE_NAMES } from '@/share/core/constant';
import emitter from '@/share/core/emitter';
import logger from '@/share/core/logger';
import { prefs } from '@/share/core/prefs';
import type { InitdRule, RULE_ACTION_OBJ } from '@/share/core/types';
import {
  getGlobal,
  IS_CHROME,
  IS_SUPPORT_STREAM_FILTER,
} from '@/share/core/utils';
import { get as getRules } from '../core/rules';
import { textDecode } from './utils';

// 最大修改8MB的Body
const MAX_BODY_SIZE = 8 * 1024 * 1024;

enum REQUEST_TYPE {
  REQUEST,
  RESPONSE,
}

type HeaderRequestDetails =
  | WebRequest.OnHeadersReceivedDetailsType
  | WebRequest.OnBeforeSendHeadersDetailsType;
type AnyRequestDetails =
  | WebRequest.OnBeforeRequestDetailsType
  | HeaderRequestDetails;

interface CustomFunctionDetail {
  id: string;
  url: string;
  tab: number;
  method: string;
  frame: number;
  parentFrame: number;
  // @ts-ignore
  proxy: any;
  type: WebRequest.ResourceType;
  time: number;
  originUrl: string;
  documentUrl: string;
  requestHeaders: WebRequest.HttpHeaders | null;
  responseHeaders: WebRequest.HttpHeaders | null;
  statusCode?: number;
  statusLine?: string;
  browser: 'firefox' | 'chrome';
}

class WebRequestHandler {
  private _disableAll = false;
  private excludeHe = true;
  private includeHeaders = false;
  private modifyBody = false;
  private savedRequestHeader = new Map();
  private deleteHeaderTimer: ReturnType<typeof setTimeout> | null = null;
  private deleteHeaderQueue = new Map();
  private textEncoder: TextEncoder | null = null;

  constructor() {
    this.initHook();
    this.loadPrefs();
  }
  get disableAll() {
    return this._disableAll;
  }
  set disableAll(to) {
    if (this._disableAll === to) {
      return;
    }
    this._disableAll = to;
  }

  private createHeaderListener(type: string): any {
    const result = ['blocking'];
    result.push(type);
    if (
      IS_CHROME &&
      Object.hasOwn(
        chrome.webRequest.OnBeforeSendHeadersOptions,
        'EXTRA_HEADERS',
      )
    ) {
      result.push('extraHeaders');
    }
    return result;
  }

  private initHook() {
    browser.webRequest.onBeforeRequest.addListener(
      this.handleBeforeRequest.bind(this),
      { urls: ['<all_urls>'] },
      ['blocking'],
    );
    browser.webRequest.onBeforeSendHeaders.addListener(
      this.handleBeforeSend.bind(this),
      { urls: ['<all_urls>'] },
      this.createHeaderListener('requestHeaders'),
    );
    browser.webRequest.onHeadersReceived.addListener(
      this.handleReceived.bind(this),
      { urls: ['<all_urls>'] },
      this.createHeaderListener('responseHeaders'),
    );
  }

  private loadPrefs() {
    emitter.on(emitter.EVENT_PREFS_UPDATE, (key: string, val: any) => {
      switch (key) {
        case 'disable-all':
          this.disableAll = val;
          break;
        case 'include-headers':
          this.includeHeaders = val;
          break;
        case 'modify-body':
          this.modifyBody = val;
          break;
        default:
          break;
      }
    });

    prefs.ready(() => {
      this.disableAll = Boolean(prefs.get('disable-all'));
      this.includeHeaders = Boolean(prefs.get('include-headers'));
      this.modifyBody = Boolean(prefs.get('modify-body'));
    });
  }

  private beforeAll(e: AnyRequestDetails) {
    if (this.disableAll) {
      return false;
    }
    // 判断是否是HE自身
    if (this.excludeHe && e.url.indexOf(browser.runtime.getURL('')) === 0) {
      return false;
    }
    return true;
  }

  /**
   * BeforeRequest事件，可撤销、重定向
   * @param any e
   */
  handleBeforeRequest(e: WebRequest.OnBeforeRequestDetailsType) {
    if (!this.beforeAll(e)) {
      return;
    }
    logger.debug(`handle before request ${e.url}`, e);
    // 可用：重定向，阻止加载
    const rule = getRules(TABLE_NAMES.request, {
      url: e.url,
      enable: true,
      runner: 'web_request',
      resourceType: e.type,
    });
    // Browser is starting up, pass all requests
    if (rule === null) {
      return;
    }
    let redirectTo = e.url;
    const detail = this.makeDetails(e);
    for (const item of rule) {
      if (item.action === 'cancel' && !item.isFunction) {
        return { cancel: true };
      }
      if (item.isFunction) {
        try {
          const r = item._func(redirectTo, detail);
          if (typeof r === 'string') {
            logger.debug(`[rule: ${item.id}] redirect ${redirectTo} to ${r}`);
            redirectTo = r;
          }
          if (
            r === '_header_editor_cancel_' ||
            (item.action === 'cancel' && r === true)
          ) {
            logger.debug(`[rule: ${item.id}] cancel`);
            return { cancel: true };
          }
        } catch (err) {
          console.error(err);
        }
      } else if (item.to) {
        if (item.condition?.regex || item.matchType === 'regexp') {
          const to = redirectTo.replace(item._reg, item.to);
          logger.debug(`[rule: ${item.id}] redirect ${redirectTo} to ${to}`);
          redirectTo = to;
        } else {
          logger.debug(
            `[rule: ${item.id}] redirect ${redirectTo} to ${item.to}`,
          );
          redirectTo = item.to;
        }
      }
    }
    if (redirectTo && redirectTo !== e.url) {
      if (/^([a-zA-Z0-9]+)%3A/.test(redirectTo)) {
        redirectTo = decodeURIComponent(redirectTo);
      }
      return { redirectUrl: redirectTo };
    }
  }

  /**
   * beforeSend事件，可修改请求头
   * @param any e
   */
  handleBeforeSend(e: WebRequest.OnBeforeSendHeadersDetailsType) {
    if (!this.beforeAll(e)) {
      return;
    }
    // 修改请求头
    if (!e.requestHeaders) {
      return;
    }
    logger.debug(`handle before send ${e.url}`, e.requestHeaders);
    const rule = getRules(TABLE_NAMES.sendHeader, {
      url: e.url,
      enable: true,
      runner: 'web_request',
      type: RULE_TYPE.MODIFY_SEND_HEADER,
      resourceType: e.type,
    });
    // Browser is starting up, pass all requests
    if (rule === null) {
      return;
    }
    this.modifyHeaders(e, REQUEST_TYPE.REQUEST, rule);
    logger.debug(`handle before send:finish ${e.url}`, e.requestHeaders);
    return { requestHeaders: e.requestHeaders };
  }

  handleReceived(e: WebRequest.OnHeadersReceivedDetailsType) {
    if (!this.beforeAll(e)) {
      return;
    }
    const detail = this.makeDetails(e);
    // 删除暂存的headers
    if (this.includeHeaders) {
      detail.requestHeaders = this.savedRequestHeader.get(e.requestId) || null;
      this.savedRequestHeader.delete(e.requestId);
      this.deleteHeaderQueue.delete(e.requestId);
    }
    // 修改响应体
    if (this.modifyBody) {
      let canModifyBody = true;
      // 检查有没有Content-Length头，如有，则不能超过MAX_BODY_SIZE，否则不进行修改
      if (e.responseHeaders) {
        for (const it of e.responseHeaders) {
          if (it.name.toLowerCase() === 'content-length') {
            if (it.value && parseInt(it.value, 10) >= MAX_BODY_SIZE) {
              canModifyBody = false;
            }
            break;
          }
        }
      }
      if (canModifyBody) {
        this.modifyReceivedBody(e, detail);
      }
    }
    // 修改响应头
    if (!e.responseHeaders) {
      return;
    }
    logger.debug(`handle received ${e.url}`, e.responseHeaders);
    const rule = getRules(TABLE_NAMES.receiveHeader, {
      url: e.url,
      enable: true,
      runner: 'web_request',
      resourceType: e.type,
    });
    // Browser is starting up, pass all requests
    if (rule) {
      this.modifyHeaders(e, REQUEST_TYPE.RESPONSE, rule, detail);
    }
    // response also can modify headers
    const respRule = getRules(TABLE_NAMES.receiveBody, {
      url: e.url,
      enable: true,
      resourceType: e.type,
    });
    // Browser is starting up, pass all requests
    if (respRule) {
      this.modifyHeaders(e, REQUEST_TYPE.RESPONSE, respRule, detail);
    }
    logger.debug(`handle received:finish ${e.url}`, e.responseHeaders);
    return { responseHeaders: e.responseHeaders };
  }

  private makeDetails(request: AnyRequestDetails): CustomFunctionDetail {
    const details = {
      id: request.requestId,
      url: request.url,
      tab: request.tabId,
      method: request.method,
      frame: request.frameId,
      parentFrame: request.parentFrameId,
      // @ts-ignore
      proxy: request.proxyInfo || null,
      type: request.type,
      time: request.timeStamp,
      originUrl: request.originUrl || '',
      documentUrl: request.documentUrl || '',
      requestHeaders: null,
      responseHeaders: null,
      browser: BROWSER_TYPE,
    };

    ['statusCode', 'statusLine', 'requestHeaders', 'responseHeaders'].forEach(
      p => {
        if (p in request) {
          // @ts-ignore
          details[p] = request[p];
        }
      },
    );

    return details;
  }

  private modifyHeaders(
    request: HeaderRequestDetails,
    type: REQUEST_TYPE,
    rule: InitdRule[],
    presetDetail?: CustomFunctionDetail,
  ) {
    const headers =
      type === REQUEST_TYPE.REQUEST
        ? (request as WebRequest.OnBeforeSendHeadersDetailsType).requestHeaders
        : (request as WebRequest.OnHeadersReceivedDetailsType).responseHeaders;
    if (!headers) {
      return;
    }
    if (this.includeHeaders && type === REQUEST_TYPE.REQUEST) {
      // 暂存headers
      this.savedRequestHeader.set(
        request.requestId,
        (request as WebRequest.OnBeforeSendHeadersDetailsType).requestHeaders,
      );
      this.autoDeleteSavedHeader(request.requestId);
    }
    const newHeaders: { [key: string]: string } = {};
    const functions: InitdRule[] = [];
    for (let i = 0; i < rule.length; i++) {
      const item = rule[i];
      if (item._runner === 'dnr' && ENABLE_DNR) {
        continue;
      }
      if (item.isFunction) {
        if (item.ruleType !== RULE_TYPE.MODIFY_RECV_BODY) {
          // skip body modification rules
          functions.push(item);
          continue;
        }
      }
      if (item.headers) {
        Object.assign(newHeaders, item.headers);
      } else if (item.action) {
        const { name, value } = item.action as RULE_ACTION_OBJ;
        newHeaders[name] = value;
      }
    }
    for (let i = 0; i < headers.length; i++) {
      const name = headers[i].name.toLowerCase();
      if (newHeaders[name] === undefined) {
        continue;
      }
      if (newHeaders[name] === '_header_editor_remove_') {
        headers.splice(i, 1);
        i--;
      } else {
        headers[i].value = newHeaders[name];
      }
      delete newHeaders[name];
    }
    for (const k in newHeaders) {
      if (newHeaders[k] === '_header_editor_remove_') {
        continue;
      }
      headers.push({
        name: k,
        value: newHeaders[k],
      });
    }
    if (functions.length > 0) {
      const detail = presetDetail || this.makeDetails(request);
      functions.forEach(item => {
        try {
          item._func(headers, detail);
        } catch (e) {
          console.error(e);
        }
      });
    }
  }

  private autoDeleteSavedHeader(id?: string) {
    if (id) {
      this.deleteHeaderQueue.set(id, new Date().getTime() / 100);
    }
    if (this.deleteHeaderTimer !== null) {
      return;
    }
    this.deleteHeaderTimer = getGlobal().setTimeout(() => {
      // clear timeout
      if (this.deleteHeaderTimer) {
        clearTimeout(this.deleteHeaderTimer);
      }
      this.deleteHeaderTimer = null;
      // check time
      const curTime = new Date().getTime() / 100;
      // k: id, v: time
      const iter = this.deleteHeaderQueue.entries();
      for (const [k, v] of iter) {
        if (curTime - v >= 90) {
          this.savedRequestHeader.delete(k);
          this.deleteHeaderQueue.delete(k);
        }
      }
      if (this.deleteHeaderQueue.size > 0) {
        this.autoDeleteSavedHeader();
      }
    }, 10000);
  }

  private modifyReceivedBody(
    e: WebRequest.OnHeadersReceivedDetailsType,
    detail: CustomFunctionDetail,
  ) {
    if (!IS_SUPPORT_STREAM_FILTER) {
      return;
    }

    const rule = getRules(TABLE_NAMES.receiveBody, {
      url: e.url,
      enable: true,
      runner: 'web_request',
      type: RULE_TYPE.MODIFY_RECV_BODY,
      resourceType: e.type,
    });
    if (rule === null) {
      return;
    }
    const hasCustomFunction = rule.some(item => item.isFunction);
    // simple execute
    if (!hasCustomFunction) {
      const filter = browser.webRequest.filterResponseData(e.requestId);
      filter.onstop = () => {
        const finalBody = last(rule)?.body?.value;
        if (typeof finalBody !== 'undefined') {
          // 缓存实例，减少开销
          if (!this.textEncoder) {
            this.textEncoder = new TextEncoder();
          }
          filter.write(this.textEncoder.encode(finalBody));
        }
        filter.close();
      };
      return;
    }

    const filter = browser.webRequest.filterResponseData(e.requestId);
    let buffers: Uint8Array | null = null;

    filter.ondata = event => {
      const { data } = event;
      if (buffers === null) {
        buffers = new Uint8Array(data);
        return;
      }
      const buffer = new Uint8Array(buffers.byteLength + data.byteLength);
      // 将响应分段数据收集拼接起来，在完成加载后整体替换。
      // 这可能会改变浏览器接收数据分段渲染的行为。
      buffer.set(buffers);
      buffer.set(new Uint8Array(data), buffers.buffer.byteLength);
      buffers = buffer;
      // 如果长度已经超长了，那就不要尝试修改了
      if (buffers.length > MAX_BODY_SIZE) {
        buffers = null;
        filter.close();
      }
    };

    // @ts-ignore
    filter.onstop = () => {
      if (buffers === null) {
        filter.close();
        return;
      }

      // 缓存实例，减少开销
      if (!this.textEncoder) {
        this.textEncoder = new TextEncoder();
      }

      let finalBody: string | null = null;
      let hasChanged = false;

      for (const item of rule!) {
        const encoding = item.encoding || 'UTF-8';
        try {
          if (!finalBody) {
            const body = textDecode(encoding, buffers);
            if (body) {
              finalBody = body;
            }
          }
          const text = item._func(finalBody, detail);
          if (typeof text === 'string' && text !== finalBody) {
            finalBody = text;
            hasChanged = true;
          }
        } catch (err) {
          console.error(err);
        }
      }

      if (hasChanged && finalBody) {
        filter.write(this.textEncoder.encode(finalBody));
      } else {
        filter.write(buffers);
      }
      buffers = null;
      filter.close();
    };

    // @ts-ignore
    filter.onerror = () => {
      buffers = null;
    };
  }
}

export const createWebRequestHandler = () => new WebRequestHandler();
