import emit from 'share/core/emit';
import rules from 'share/core/rules';
import { prefs } from 'share/core/storage';
import { IS_CHROME, IS_SUPPORT_STREAM_FILTER } from 'share/core/utils';
import { Rule } from 'share/core/var';
import { TextDecoder, TextEncoder } from 'text-encoding';
import { browser, WebRequest } from 'webextension-polyfill-ts';

// 最大修改8MB的Body
const MAX_BODY_SIZE = 8 * 1024 * 1024;

enum REQUEST_TYPE {
  REQUEST,
  RESPONSE,
}

type HeaderRequestDetails = WebRequest.OnHeadersReceivedDetailsType | WebRequest.OnBeforeSendHeadersDetailsType;
type AnyRequestDetails = WebRequest.OnBeforeRequestDetailsType | HeaderRequestDetails;
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
}
class RequestHandler {
  private _disableAll = false;
  private excludeHe = true;
  private includeHeaders = false;
  private modifyBody = false;
  private savedRequestHeader = new Map();
  private deleteHeaderTimer: number | null = null;
  private deleteHeaderQueue = new Map();
  private textDecoder: Map<string, TextDecoder> = new Map();
  private textEncoder: Map<string, TextEncoder> = new Map();

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
    browser.browserAction.setIcon({
      path: `/assets/images/128${to ? 'w' : ''}.png`,
    });
  }

  private createHeaderListener(type: string): any {
    const result = ['blocking'];
    result.push(type);
    if (
      IS_CHROME &&
      // @ts-ignore
      chrome.webRequest.OnBeforeSendHeadersOptions.hasOwnProperty('EXTRA_HEADERS')
    ) {
      result.push('extraHeaders');
    }
    return result;
  }

  private initHook() {
    browser.webRequest.onBeforeRequest.addListener(this.handleBeforeRequest.bind(this), { urls: ['<all_urls>'] }, [
      'blocking',
    ]);
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
    emit.on(emit.EVENT_PREFS_UPDATE, (key: string, val: any) => {
      switch (key) {
        case 'exclude-he':
          this.excludeHe = val;
          break;
        case 'disable-all':
          this.disableAll = val;
          break;
        case 'include-headers':
          this.includeHeaders = val;
          break;
        case 'modify-body':
          this.modifyBody = val;
          break;
      }
    });

    prefs.ready(() => {
      this.excludeHe = prefs.get('exclude-he');
      this.disableAll = prefs.get('disable-all');
      this.includeHeaders = prefs.get('include-headers');
      this.modifyBody = prefs.get('modify-body');
    });
  }

  private beforeAll(e: AnyRequestDetails) {
    if (this.disableAll) {
      return false;
    }
    // 判断是否是HE自身
    if (this.excludeHe && e.url.indexOf(browser.extension.getURL('')) === 0) {
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
    // 可用：重定向，阻止加载
    const rule = rules.get('request', { url: e.url, enable: true });
    // Browser is starting up, pass all requests
    if (rule === null) {
      return;
    }
    let redirectTo = e.url;
    const detail = this.makeDetails(e);
    for (const item of rule) {
      if (item.action === 'cancel' && !item.isFunction) {
        return { cancel: true };
      } else {
        if (item.isFunction) {
          try {
            const r = item._func(redirectTo, detail);
            if (typeof r === 'string') {
              redirectTo = r;
            }
            if (r === '_header_editor_cancel_' || (item.action === 'cancel' && r === true)) {
              return { cancel: true };
            }
          } catch (e) {
            console.error(e);
          }
        } else {
          if (item.matchType === 'regexp') {
            redirectTo = redirectTo.replace(item._reg, item.to);
          } else {
            redirectTo = item.to;
          }
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
    const rule = rules.get('sendHeader', { url: e.url, enable: true });
    // Browser is starting up, pass all requests
    if (rule === null) {
      return;
    }
    this.modifyHeaders(e, REQUEST_TYPE.REQUEST, rule);
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
    const rule = rules.get('receiveHeader', { url: e.url, enable: true });
    // Browser is starting up, pass all requests
    if (rule) {
      this.modifyHeaders(e, REQUEST_TYPE.RESPONSE, rule, detail);
    }
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
    };

    ['statusCode', 'statusLine', 'requestHeaders', 'responseHeaders'].forEach(p => {
      if (p in request) {
        // @ts-ignore
        details[p] = request[p];
      }
    });

    return details;
  }

  private textEncode(encoding: string, text: string) {
    let encoder = this.textEncoder.get(encoding);
    if (!encoder) {
      // UTF-8使用原生API，性能更好
      if (encoding === 'UTF-8' && window.TextEncoder) {
        encoder = new window.TextEncoder();
      } else {
        encoder = new TextEncoder(encoding, { NONSTANDARD_allowLegacyEncoding: true });
      }
      this.textEncoder.set(encoding, encoder);
    }
    // 防止解码失败导致整体错误
    try {
      return encoder.encode(text);
    } catch (e) {
      console.error(e);
      return new Uint8Array();
    }
  }

  private textDecode(encoding: string, buffer: Uint8Array) {
    let encoder = this.textDecoder.get(encoding);
    if (!encoder) {
      // 如果原生支持的话，优先使用原生
      if (window.TextDecoder) {
        try {
          encoder = new window.TextDecoder(encoding);
        } catch (e) {
          encoder = new TextDecoder(encoding);
        }
      } else {
        encoder = new TextDecoder(encoding);
      }
      this.textDecoder.set(encoding, encoder);
    }
    // 防止解码失败导致整体错误
    try {
      return encoder.decode(buffer);
    } catch (e) {
      console.error(e);
      return '';
    }
  }

  private modifyHeaders(
    request: HeaderRequestDetails,
    type: REQUEST_TYPE,
    rule: Rule[],
    presetDetail?: CustomFunctionDetail,
  ) {
    // @ts-ignore
    const headers = request[type === REQUEST_TYPE.REQUEST ? 'requestHeaders' : 'responseHeaders'];
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
    let hasFunction = false;
    for (let i = 0; i < rule.length; i++) {
      if (!rule[i].isFunction) {
        // @ts-ignore
        newHeaders[rule[i].action.name] = rule[i].action.value;
        rule.splice(i, 1);
        i--;
      } else {
        hasFunction = true;
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
    if (hasFunction) {
      const detail = presetDetail ? presetDetail : this.makeDetails(request);
      rule.forEach(item => {
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
    this.deleteHeaderTimer = window.setTimeout(() => {
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

  private modifyReceivedBody(e: WebRequest.OnHeadersReceivedDetailsType, detail: CustomFunctionDetail) {
    if (!IS_SUPPORT_STREAM_FILTER) {
      return;
    }

    let rule = rules.get('receiveBody', { url: e.url, enable: true });
    if (rule === null) {
      return;
    }
    rule = rule.filter(item => item.isFunction);
    if (rule.length === 0) {
      return;
    }

    const filter = browser.webRequest.filterResponseData(e.requestId);
    let buffers: Uint8Array | null = null;
    // @ts-ignore
    filter.ondata = (event: WebRequest.StreamFilterEventData) => {
      const data = event.data;
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
      for (const item of rule!) {
        const encoding = item.encoding || 'UTF-8';
        try {
          const _text = this.textDecode(encoding, new Uint8Array(buffers!.buffer));
          const text = item._func(_text, detail);
          if (typeof text === 'string' && text !== _text) {
            buffers = this.textEncode(encoding, text);
          }
        } catch (e) {
          console.error(e);
        }
      }

      filter.write(buffers.buffer);
      buffers = null;
      filter.close();
    };

    // @ts-ignore
    filter.onerror = () => {
      buffers = null;
    };
  }
}

export default function createRequestHandler() {
  return new RequestHandler();
}
