import { last } from 'lodash-es';
import browser, { type WebRequest } from 'webextension-polyfill';
import { IS_SUPPORT_STREAM_FILTER } from '@/share/core/browser';
import {
  RULE_CANCEL_MARK,
  RULE_REMOVE_MARK,
  RULE_TYPE,
  TABLE_NAMES,
} from '@/share/core/constant';
import emitter from '@/share/core/emitter';
import logger from '@/share/core/logger';
import { prefs } from '@/share/core/prefs';
import type { InitdRule, RULE_ACTION_OBJ } from '@/share/core/types';
import { IS_CHROME, isValidArray } from '@/share/core/utils';
import { filter, get as getRules } from '../core/rules';
import { util } from '../utils/function-util';
import { textDecode, textEncode } from '../utils/text-coder';

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
  incognito?: boolean;
  cookieStoreId?: string;
  requestHeaders: WebRequest.HttpHeaders | null;
  responseHeaders: WebRequest.HttpHeaders | null;
  statusCode?: number;
  statusLine?: string;
  browser: 'firefox' | 'chrome';
  rawResponse?: Uint8Array;
}

function createHeaderListener(spec: string): any {
  const result = ['blocking', spec];
  if (
    IS_CHROME &&
    Object.hasOwn(chrome.webRequest.OnBeforeSendHeadersOptions, 'EXTRA_HEADERS')
  ) {
    result.push('extraHeaders');
  }
  return result;
}

class WebRequestHandler {
  private disableAll = false;
  private includeHeaders = false;
  private modifyBody = false;
  private savedRequestHeader = new Map();
  private deleteHeaderTimer: ReturnType<typeof setTimeout> | null = null;
  private deleteHeaderQueue = new Map<string, number>();

  constructor() {
    this.handleBeforeRequest = this.handleBeforeRequest.bind(this);
    this.handleBeforeSend = this.handleBeforeSend.bind(this);
    this.handleReceived = this.handleReceived.bind(this);
    this.loadPrefs();
  }

  private setDisableAll(to: boolean, forceCheckHook = false) {
    logger.debug(`[web-request-handler] disableAll`, () => [
      this.disableAll,
      to,
    ]);
    if (this.disableAll !== to || forceCheckHook) {
      this.disableAll = to;
      if (to) {
        this.removeHook();
      } else {
        this.initHook();
      }
    }
  }

  private initHook() {
    const { onBeforeRequest, onBeforeSendHeaders, onHeadersReceived } =
      browser.webRequest;
    if (!onBeforeRequest.hasListener(this.handleBeforeRequest)) {
      onBeforeRequest.addListener(
        this.handleBeforeRequest,
        { urls: ['<all_urls>'] },
        ['blocking', 'requestBody'],
      );
    }
    if (!onBeforeSendHeaders.hasListener(this.handleBeforeSend)) {
      onBeforeSendHeaders.addListener(
        this.handleBeforeSend,
        { urls: ['<all_urls>'] },
        createHeaderListener('requestHeaders'),
      );
    }
    if (!onHeadersReceived.hasListener(this.handleReceived)) {
      onHeadersReceived.addListener(
        this.handleReceived,
        { urls: ['<all_urls>'] },
        createHeaderListener('responseHeaders'),
      );
    }
  }

  private removeHook() {
    browser.webRequest.onBeforeRequest.removeListener(this.handleBeforeRequest);
    browser.webRequest.onBeforeSendHeaders.removeListener(
      this.handleBeforeSend,
    );
    browser.webRequest.onHeadersReceived.removeListener(this.handleReceived);
  }

  private loadPrefs() {
    emitter.on(emitter.EVENT_PREFS_UPDATE, (key: string, val: any) => {
      switch (key) {
        case 'disable-all':
          this.setDisableAll(Boolean(val), true);
          break;
        case 'include-headers':
          this.includeHeaders = Boolean(val);
          break;
        case 'modify-body':
          this.modifyBody = Boolean(val);
          break;
        default:
          break;
      }
    });

    prefs.ready(() => {
      this.setDisableAll(Boolean(prefs.get('disable-all')), true);
      this.includeHeaders = Boolean(prefs.get('include-headers'));
      this.modifyBody = Boolean(prefs.get('modify-body'));
    });
  }

  private beforeAll(e: AnyRequestDetails) {
    if (this.disableAll) {
      return false;
    }
    if (
      e.url.startsWith('chrome-extension://') ||
      e.url.startsWith('moz-extension://')
    ) {
      return false;
    }
    return true;
  }

  private getRedirectUrl(rules: InitdRule[], e: AnyRequestDetails) {
    let redirectTo = e.url;
    const detail = this.makeDetails(e);
    for (const item of rules) {
      if (item.ruleType === RULE_TYPE.CANCEL && !item.isFunction) {
        return { cancel: true };
      }
      if (item.isFunction) {
        try {
          const r = item._func(redirectTo, detail, util);
          if (typeof r === 'string') {
            logger.debug(
              `[web-request-handler] [rule: ${item.id}] redirect ${redirectTo} to ${r}`,
            );
            redirectTo = r;
          }
          if (
            r === RULE_CANCEL_MARK ||
            (item.ruleType === RULE_TYPE.CANCEL && r === true)
          ) {
            logger.debug(`[web-request-handler] [rule: ${item.id}] cancel`);
            return { cancel: true };
          }
        } catch (err) {
          console.error(err);
        }
      } else if (item.to) {
        if (item.condition?.regex || item.matchType === 'regexp') {
          const to = redirectTo.replaceAll(item._reg, item.to);
          logger.debug(
            `[web-request-handler] [rule: ${item.id}] redirect ${redirectTo} to ${to}`,
          );
          redirectTo = to;
        } else {
          logger.debug(
            `[web-request-handler] [rule: ${item.id}] redirect ${redirectTo} to ${item.to}`,
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
   * BeforeRequest事件，可撤销、重定向
   * @param any e
   */
  handleBeforeRequest(e: WebRequest.OnBeforeRequestDetailsType) {
    if (!this.beforeAll(e)) {
      return;
    }
    logger.debug(`[web-request-handler] handle before request ${e.url}`, () => [
      e,
    ]);
    // 可用：重定向，阻止加载
    const rule = getRules(TABLE_NAMES.request, {
      url: e.url,
      enable: true,
      runner: 'web_request',
      resourceType: e.type,
      method: e.method.toLowerCase(),
    });
    // Browser is starting up, pass all requests
    if (rule === null) {
      return;
    }
    return this.getRedirectUrl(rule, e);
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
    logger.debug(`[web-request-handler] handle before send ${e.url}`, () => [
      e.requestHeaders,
    ]);
    const rule = getRules(TABLE_NAMES.sendHeader, {
      url: e.url,
      enable: true,
      runner: 'web_request',
      type: RULE_TYPE.MODIFY_SEND_HEADER,
      resourceType: e.type,
      method: e.method.toLowerCase(),
    });
    if (this.modifyHeaders(e, REQUEST_TYPE.REQUEST, rule)) {
      logger.debug(
        `[web-request-handler] handle before send:finish ${e.url}`,
        () => [e.requestHeaders],
      );
      return { requestHeaders: e.requestHeaders };
    }
    logger.debug(
      `[web-request-handler] handle before send:finish ${e.url}, no modify`,
      () => [e.requestHeaders],
    );
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
    const receiveHeaderRules =
      getRules(TABLE_NAMES.receiveHeader, {
        url: e.url,
        enable: true,
        runner: 'web_request',
        resourceType: e.type,
        method: e.method.toLowerCase(),
        responseHeaders: e.responseHeaders,
      }) || [];
    // 优先执行重定向
    const redirectRules = filter(receiveHeaderRules, {
      type: RULE_TYPE.REDIRECT_AT_RESPONSE,
    });
    if (redirectRules && redirectRules.length > 0) {
      const result = this.getRedirectUrl(redirectRules, e);
      if (result) {
        return result;
      }
    }
    // 先查找receiveBody的规则，后面复用
    const receiveBodyRules = getRules(TABLE_NAMES.receiveBody, {
      url: e.url,
      enable: true,
      resourceType: e.type,
      method: e.method.toLowerCase(),
      responseHeaders: e.responseHeaders,
    });
    // 修改响应体
    if (this.modifyBody) {
      // 检查有没有Content-Length头，如有，则不能超过MAX_BODY_SIZE，否则不进行修改
      const contentLength = Number(
        e.responseHeaders?.find(x => x.name.toLowerCase() === 'content-length')
          ?.value,
      );
      if (Number.isNaN(contentLength) || contentLength < MAX_BODY_SIZE) {
        this.modifyReceivedBody(receiveBodyRules || [], e, detail);
      }
    }
    // 修改响应头
    if (!e.responseHeaders) {
      return;
    }
    logger.debug(`[web-request-handler] handle received ${e.url}`, () => [
      e.responseHeaders,
    ]);
    const rule = filter(receiveHeaderRules, {
      type: RULE_TYPE.MODIFY_RECV_HEADER,
    });
    const hasModified1 = this.modifyHeaders(
      e,
      REQUEST_TYPE.RESPONSE,
      rule,
      detail,
    );
    // response also can modify headers
    const hasModified2 = this.modifyHeaders(
      e,
      REQUEST_TYPE.RESPONSE,
      receiveBodyRules,
      detail,
    );
    if (hasModified1 || hasModified2) {
      logger.debug(
        `[web-request-handler] handle received:finish ${e.url}`,
        () => [e.responseHeaders],
      );
      return { responseHeaders: e.responseHeaders };
    }
    logger.debug(
      `[web-request-handler] handle received:finish ${e.url}, no modify`,
      () => [e.responseHeaders],
    );
  }

  private makeDetails(request: AnyRequestDetails): CustomFunctionDetail {
    const details = {
      id: request.requestId,
      url: request.url,
      tab: request.tabId,
      method: request.method,
      frame: request.frameId,
      parentFrame: request.parentFrameId,
      proxy: (request as any).proxyInfo || null,
      type: request.type,
      time: request.timeStamp,
      originUrl: request.originUrl || '',
      documentUrl: request.documentUrl || '',
      incognito: request.incognito,
      cookieStoreId: request.cookieStoreId,
      requestHeaders: null,
      responseHeaders: null,
      browser: BROWSER_TYPE,
    };

    [
      'statusCode',
      'statusLine',
      'requestHeaders',
      'responseHeaders',
      'requestBody',
    ].forEach(p => {
      if (p in request) {
        (details as any)[p] = (request as any)[p];
      }
    });

    return details;
  }

  private modifyHeaders(
    request: HeaderRequestDetails,
    type: REQUEST_TYPE,
    rule: InitdRule[] | null,
    presetDetail?: CustomFunctionDetail,
  ) {
    if (!rule || rule.length === 0) {
      return false;
    }
    const headers =
      type === REQUEST_TYPE.REQUEST
        ? (request as WebRequest.OnBeforeSendHeadersDetailsType).requestHeaders
        : (request as WebRequest.OnHeadersReceivedDetailsType).responseHeaders;
    if (!headers) {
      return false;
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
      } else if (typeof item.action === 'object') {
        const { name, value } = item.action as RULE_ACTION_OBJ;
        newHeaders[name] = value;
      }
    }
    for (let i = 0; i < headers.length; i++) {
      const name = headers[i].name.toLowerCase();
      if (typeof newHeaders[name] === 'undefined') {
        continue;
      }
      if (newHeaders[name] === RULE_REMOVE_MARK) {
        headers.splice(i, 1);
        i--;
      } else {
        headers[i].value = newHeaders[name];
        delete newHeaders[name];
      }
    }
    for (const k in newHeaders) {
      if (newHeaders[k] === RULE_REMOVE_MARK) {
        continue;
      }
      headers.push({
        name: k,
        value: newHeaders[k],
      });
    }
    if (functions.length > 0) {
      const detail = presetDetail || this.makeDetails(request);
      for (const item of functions) {
        try {
          item._func(headers, detail, util);
        } catch (e) {
          console.error(e);
        }
      }
    }
    return true;
  }

  private autoDeleteSavedHeader(id?: string) {
    if (id) {
      this.deleteHeaderQueue.set(id, Date.now());
    }
    if (this.deleteHeaderTimer !== null) {
      return;
    }
    this.deleteHeaderTimer = setTimeout(() => {
      // clear timeout
      if (this.deleteHeaderTimer) {
        clearTimeout(this.deleteHeaderTimer);
      }
      this.deleteHeaderTimer = null;
      const curTime = Date.now();
      // k: id, v: time
      const iter = this.deleteHeaderQueue.entries();
      for (const [k, v] of iter) {
        if (curTime - v >= 9000) {
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
    baseRules: InitdRule[],
    e: WebRequest.OnHeadersReceivedDetailsType,
    detail: CustomFunctionDetail,
  ) {
    if (!IS_SUPPORT_STREAM_FILTER) {
      return;
    }

    const rule = filter(baseRules, {
      runner: 'web_request',
      type: RULE_TYPE.MODIFY_RECV_BODY,
    });
    if (!isValidArray(rule)) {
      return;
    }
    const hasCustomFunction = rule.some(item => item.isFunction);
    // simple execute
    if (!hasCustomFunction) {
      const responseFilter = browser.webRequest.filterResponseData(e.requestId);
      responseFilter.onstop = () => {
        const finalBody = last(rule)?.body?.value;
        if (typeof finalBody !== 'undefined') {
          responseFilter.write(textEncode(finalBody));
        }
        responseFilter.close();
      };
      return;
    }

    const responseFilter = browser.webRequest.filterResponseData(e.requestId);
    const chunks: ArrayBuffer[] = [];
    let bufferedBytes = 0;
    let passThrough = false; // 一旦判定超限就切纯透传，不再缓冲

    responseFilter.ondata = event => {
      const { data } = event;
      // 已判定超限：直接转发，零拷贝、零额外内存
      if (passThrough) {
        responseFilter.write(data);
        return;
      }

      // 把超限判断前置，第一个分片也能覆盖到
      if (bufferedBytes + data.byteLength > MAX_BODY_SIZE) {
        // 先把已攒下来的原样吐出去，避免响应体被截断
        for (const ab of chunks) responseFilter.write(ab);
        chunks.length = 0;
        bufferedBytes = 0;
        passThrough = true;
        responseFilter.write(data);
        return;
      }

      chunks.push(data); // 只存引用，不拷贝
      bufferedBytes += data.byteLength;
    };

    responseFilter.onstop = () => {
      if (passThrough) {
        chunks.length = 0;
        responseFilter.close();
        return;
      }

      // 分配 + 拷贝
      const buffers = new Uint8Array(bufferedBytes);
      let offset = 0;
      for (const ab of chunks) {
        buffers.set(new Uint8Array(ab), offset);
        offset += ab.byteLength;
      }
      chunks.length = 0;

      let finalBody: string | Uint8Array | null = null;
      let hasChanged = false;

      detail.rawResponse = buffers;

      for (const item of rule!) {
        const encoding = item.encoding || 'utf-8';
        try {
          if (!finalBody) {
            const body = textDecode(encoding, buffers);
            if (body) {
              finalBody = body;
            }
          }
          const result = item._func(finalBody, detail, util);
          if (typeof result === 'string' && result !== finalBody) {
            finalBody = result;
            hasChanged = true;
          }
          if (typeof result === 'object' && result instanceof Uint8Array) {
            finalBody = result;
            hasChanged = true;
          }
        } catch (err) {
          console.error(err);
        }
      }

      if (hasChanged && finalBody) {
        if (typeof finalBody === 'string') {
          responseFilter.write(textEncode(finalBody));
        } else {
          responseFilter.write(finalBody);
        }
      } else {
        responseFilter.write(buffers);
      }
      responseFilter.close();
    };

    responseFilter.onerror = () => {
      if (bufferedBytes) {
        for (const ab of chunks) responseFilter.write(ab);
      }
      passThrough = true;
      chunks.length = 0;
      responseFilter.close();
    };
  }
}

export const createWebRequestHandler = () => new WebRequestHandler();
