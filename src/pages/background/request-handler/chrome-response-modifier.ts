import browser from 'webextension-polyfill';
import type { DeclarativeNetRequest } from 'webextension-polyfill/namespaces/declarativeNetRequest';
import { RULE_TYPE, TABLE_NAMES } from '@/share/core/constant';
import emitter from '@/share/core/emitter';
import logger from '@/share/core/logger';
import { prefs } from '@/share/core/prefs';
import type { InitdRule, Rule } from '@/share/core/types';
import { isValidArray } from '@/share/core/utils';
import { filter, get, waitLoad } from '../core/rules';
import { textDecode, textEncode } from './utils';

function safeBtoa(str: string) {
  const bytes = textEncode(str);
  const binary = Array.from(bytes, b => String.fromCharCode(b)).join('');
  return btoa(binary);
}

function safeAtob(encoding: string, base64: string) {
  const binary = atob(base64);
  const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
  return textDecode(encoding, bytes);
}

const resourceTypeMap: Record<string, DeclarativeNetRequest.ResourceType> = {
  Document: 'main_frame',
  Stylesheet: 'stylesheet',
  Image: 'image',
  Media: 'media',
  Font: 'font',
  Script: 'script',
  XHR: 'xmlhttprequest',
  Fetch: 'xmlhttprequest',
  WebSocket: 'websocket',
  Ping: 'ping',
  CSPViolationReport: 'csp_report',
};

class ChromeResponseModifier {
  private disableAll = false;
  private modifyBody = false;
  private isEnabled = false;
  private stage = 'Request';
  private rules: InitdRule[] = [];
  private attached = new Set<number>();
  private fetchEnabled = new Set<number>();
  private pendingTabIds = new Set<number>();

  constructor() {
    this.initRules();
    this.initHook();
    this.loadPrefs();
  }

  async initRules() {
    await waitLoad();
    const rules = get(TABLE_NAMES.receiveBody, {
      enable: true,
      type: RULE_TYPE.MODIFY_RECV_BODY,
    });
    this.rules = isValidArray(rules) ? rules : [];
    this.checkEnable();
    this.checkStage();
  }

  private async getAttached() {
    const targets = await chrome.debugger.getTargets();
    const res = targets.filter(x => Boolean(x.tabId) && x.attached);
    this.attached = new Set(res.map(x => x.tabId!));
    this.fetchEnabled.forEach(x => {
      if (!this.attached.has(x)) {
        this.fetchEnabled.delete(x);
      }
    });
    return {
      targets: res,
      tabIds: this.attached,
    };
  }

  private async detachTab(tabId?: number) {
    if (typeof tabId === 'undefined') {
      return;
    }
    if (!this.attached.has(tabId)) {
      return;
    }
    try {
      logger.debug('[chrome-response-modifier] detach tab', tabId);
      await chrome.debugger.detach({ tabId });
      this.attached.delete(tabId);
    } catch (e) {
      console.error('detachTab failed:', e);
    }
  }

  private async attachTab(tabId?: number) {
    if (typeof tabId === 'undefined') {
      return;
    }
    if (this.attached.has(tabId) || this.pendingTabIds.has(tabId)) {
      return;
    }
    try {
      this.pendingTabIds.add(tabId);
      logger.debug('[chrome-response-modifier] attach tab', tabId);
      await chrome.debugger.attach({ tabId }, '1.3');
      this.attached.add(tabId);
    } catch (e) {
      logger.debug('[chrome-response-modifier] attach tab failed', tabId, e);
    }
    this.pendingTabIds.delete(tabId);
  }

  private async enableFetch(tabId?: number) {
    if (typeof tabId === 'undefined') {
      return;
    }
    await this.attachTab(tabId);
    if (this.fetchEnabled.has(tabId) || this.pendingTabIds.has(tabId)) {
      return;
    }
    try {
      this.pendingTabIds.add(tabId);
      logger.debug('[chrome-response-modifier] enable fetch', tabId);
      await chrome.debugger.sendCommand({ tabId: tabId }, 'Fetch.enable', {
        patterns: [
          {
            urlPattern: 'http://*',
            requestStage: this.stage,
          },
          {
            urlPattern: 'https://*',
            requestStage: this.stage,
          },
        ],
      });
      this.fetchEnabled.add(tabId);
    } catch (e) {
      logger.debug('[chrome-response-modifier] enable fetch failed', tabId, e);
    }
    this.pendingTabIds.delete(tabId);
  }

  private async disableFetch(tabId?: number) {
    if (typeof tabId === 'undefined') {
      return;
    }
    if (!this.fetchEnabled.has(tabId)) {
      return;
    }
    try {
      await chrome.debugger.sendCommand({ tabId: tabId }, 'Fetch.disable');
      this.fetchEnabled.delete(tabId);
    } catch (e) {
      console.error('Fetch.disable failed: ', e);
    }
  }

  private async checkEnable() {
    const currentEnabled =
      this.rules.length > 0 && this.modifyBody && !this.disableAll;
    logger.debug(
      '[chrome-response-modifier] checkEnable: ',
      currentEnabled,
      this.rules,
      this.modifyBody,
      this.disableAll,
      this.isEnabled,
    );
    if (this.isEnabled === currentEnabled) {
      return;
    }
    this.isEnabled = currentEnabled;
    const tabs = await browser.tabs.query({});
    const { targets } = await this.getAttached();
    if (currentEnabled) {
      tabs.forEach(tab => this.enableFetch(tab.id));
    } else {
      targets.forEach(async target => {
        await this.disableFetch(target.tabId);
        await this.detachTab(target.tabId);
      });
    }
  }

  private async checkStage() {
    if (!this.isEnabled || this.rules.length === 0) {
      return;
    }
    const hasResponse = this.rules.some(r => r.body?.stage === 'Response');
    const newStage = hasResponse ? 'Response' : 'Request';
    if (newStage !== this.stage) {
      this.stage = newStage;
      const { targets } = await this.getAttached();
      targets.forEach(async target => {
        await this.disableFetch(target.tabId);
        await this.enableFetch(target.tabId);
      });
    }
  }

  private initHook() {
    emitter.on(emitter.INNER_RULE_REMOVE, ({ table }) => {
      if (table === TABLE_NAMES.receiveBody) {
        this.initRules();
      }
    });

    emitter.on(
      emitter.INNER_RULE_UPDATE,
      ({ from, target }: { from: Rule; target: Rule }) => {
        if (
          from?.ruleType === RULE_TYPE.MODIFY_RECV_BODY ||
          target.ruleType === RULE_TYPE.MODIFY_RECV_BODY
        ) {
          this.initRules();
        }
      },
    );

    browser.tabs.onCreated.addListener(tab => this.enableFetch(tab.id));
    browser.tabs.onUpdated.addListener(tabId => this.enableFetch(tabId));
    browser.tabs.onRemoved.addListener(tabId => {
      logger.debug('[chrome-response-modifier] tab onRemoved', tabId);
      this.attached.delete(tabId);
      this.fetchEnabled.delete(tabId);
    });
    chrome.debugger.onDetach.addListener(({ tabId }) => {
      if (tabId) {
        logger.debug('[chrome-response-modifier] onDetach', tabId);
        this.attached.delete(tabId);
        this.fetchEnabled.delete(tabId);
      }
    });
    chrome.debugger.onEvent.addListener(async (source, method, params) => {
      logger.debug(
        '[chrome-response-modifier] onEvent',
        source,
        method,
        params,
      );
      if (method !== 'Fetch.requestPaused') {
        return;
      }
      const { requestId, responseHeaders, request, resourceType } =
        params as any;
      const { url } = request;
      const rules = filter(this.rules, {
        url,
        method: request.method.toLowerCase(),
        resourceType:
          typeof resourceTypeMap[resourceType] === 'undefined'
            ? 'other'
            : resourceTypeMap[resourceType],
      });
      if (!isValidArray(rules)) {
        return chrome.debugger.sendCommand(source, 'Fetch.continueRequest', {
          requestId,
        });
      }
      const newHeaders: Record<string, string> = {};
      const hasFunc = this.rules.some(item => item.isFunction);
      let finalBody: any;
      let resp: any;
      if (hasFunc) {
        resp = await chrome.debugger.sendCommand(
          source,
          'Fetch.getResponseBody',
          { requestId },
        );
      }
      for (const rule of rules) {
        if (!finalBody) {
          if (resp?.base64Encoded) {
            const body = safeAtob(rule.encoding || 'utf-8', resp.body);
            if (body) {
              finalBody = body;
            }
          } else {
            finalBody = resp?.body;
          }
        }
        if (rule.headers) {
          Object.assign(newHeaders, rule.headers);
        }
        if (rule.isFunction) {
          const body = rule._func(finalBody, {
            ...params,
            browser: 'chrome',
          });
          if (typeof body === 'string') {
            finalBody = body;
          }
        } else {
          finalBody = rule.body?.value;
        }
      }
      const finalHeaders = responseHeaders || [];
      if (!ENABLE_WEB_REQUEST) {
        for (let i = 0; i < finalHeaders.length; i++) {
          const name = finalHeaders[i].name.toLowerCase();
          if (newHeaders[name] === undefined) {
            continue;
          }
          if (newHeaders[name] === '_header_editor_remove_') {
            finalHeaders.splice(i, 1);
            i--;
          } else {
            finalHeaders[i].value = newHeaders[name];
          }
          delete newHeaders[name];
        }
      }
      return chrome.debugger.sendCommand(source, 'Fetch.fulfillRequest', {
        requestId,
        responseCode: 200,
        responseHeaders: finalHeaders,
        body: safeBtoa(finalBody),
      });
    });
  }

  private loadPrefs() {
    emitter.on(emitter.EVENT_PREFS_UPDATE, (key: string, val: any) => {
      switch (key) {
        case 'disable-all':
          this.disableAll = val;
          break;
        case 'modify-body':
          this.modifyBody = val;
          break;
        default:
          break;
      }
      this.checkEnable();
    });

    prefs.ready(() => {
      this.disableAll = Boolean(prefs.get('disable-all'));
      this.modifyBody = Boolean(prefs.get('modify-body'));
      this.checkEnable();
    });
  }
}

export const createChromeResponseModifier = () => new ChromeResponseModifier();
