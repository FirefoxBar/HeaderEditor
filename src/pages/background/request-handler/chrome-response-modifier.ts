import browser, { type Tabs } from 'webextension-polyfill';
import { IS_MATCH, RULE_TYPE, TABLE_NAMES } from '@/share/core/constant';
import emitter from '@/share/core/emitter';
import { prefs } from '@/share/core/prefs';
import { isMatchUrl } from '@/share/core/rule-utils';
import type { InitdRule, Rule } from '@/share/core/types';
import { isValidArray } from '@/share/core/utils';
import { get, waitLoad } from '../core/rules';
import { textDecode } from './utils';

function safeBtoa(str: string) {
  const bytes = new TextEncoder().encode(str);
  const binary = Array.from(bytes, b => String.fromCharCode(b)).join('');
  return btoa(binary);
}

function safeAtob(encoding: string, base64: string) {
  const binary = atob(base64);
  const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
  return textDecode(encoding, bytes);
}

class ChromeResponseModifier {
  private disableAll = false;
  private modifyBody = false;
  private isEnabled = false;
  private stage = 'Request';
  private rules: InitdRule[] = [];

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
    if (!rules) {
      this.rules = [];
      this.stage = 'Request';
      return;
    }
    this.rules = rules;
    this.checkEnable();
    this.checkStage();
  }

  private async checkEnable() {
    const currentEnabled =
      isValidArray(this.rules) && this.modifyBody && !this.disableAll;
    // debugger;
    if (this.isEnabled === currentEnabled) {
      return;
    }
    this.isEnabled = currentEnabled;
    const tabs = await browser.tabs.query({});
    if (currentEnabled) {
      tabs.forEach(tab => this.handleTab(tab));
    } else {
      tabs.forEach(async tab => {
        await chrome.debugger.sendCommand({ tabId: tab.id }, 'Fetch.disable');
        await chrome.debugger.detach({ tabId: tab.id });
      });
    }
  }

  private async checkStage() {
    if (!this.isEnabled) {
      return;
    }
    const hasResponse = this.rules.some(r => r.body?.stage === 'Response');
    const newStage = hasResponse ? 'Response' : 'Request';
    if (newStage !== this.stage) {
      this.stage = newStage;
      const tabs = await browser.tabs.query({});
      tabs.forEach(async tab => {
        await chrome.debugger.sendCommand({ tabId: tab.id }, 'Fetch.disable');
        await this.handleTab(tab);
      });
    }
  }

  private async handleTab(tab: Tabs.Tab) {
    if (!this.isEnabled) {
      return;
    }
    await chrome.debugger.attach({ tabId: tab.id }, '1.0');
    await chrome.debugger.sendCommand({ tabId: tab.id }, 'Fetch.enable', {
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
  }

  private initHook() {
    browser.tabs.onCreated.addListener(tab => this.handleTab(tab));
    chrome.debugger.onEvent.addListener(async (source, method, params) => {
      const { tabId } = source;
      if (method !== 'Fetch.requestPaused') {
        return;
      }
      const { requestId, responseHeaders, request } = params as any;
      const { url } = request;
      if (!isValidArray(this.rules)) {
        chrome.debugger.sendCommand({ tabId }, 'Fetch.continueRequest', {
          requestId,
        });
        return;
      }
      const newHeaders: Record<string, string> = {};
      const hasFunc = this.rules.some(item => item.isFunction);
      let finalBody: any;
      let resp: any;
      if (hasFunc) {
        resp = await chrome.debugger.sendCommand(
          { tabId },
          'Fetch.getResponseBody',
          { requestId },
        );
      }
      for (const rule of this.rules) {
        if (isMatchUrl(rule, url) !== IS_MATCH.MATCH) {
          continue;
        }
        if (!finalBody) {
          if (resp?.base64Encoded) {
            const body = safeAtob(rule.encoding || 'UTF-8', resp.body);
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
      return chrome.debugger.sendCommand({ tabId }, 'Fetch.fulfillRequest', {
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

    prefs.ready(() => {
      this.disableAll = Boolean(prefs.get('disable-all'));
      this.modifyBody = Boolean(prefs.get('modify-body'));
      this.checkEnable();
    });
  }
}

export const createChromeResponseModifier = () => new ChromeResponseModifier();
