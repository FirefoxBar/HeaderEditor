import browser, { Tabs } from 'webextension-polyfill';
import EventEmitter from 'eventemitter3';
import logger from './logger';
import { canAccess, getGlobal, IS_ANDROID } from './utils';
import { APIs } from './constant';

class Notify {
  event = new EventEmitter();
  private messageQueue: Array<{
    request: any;
    resolve: (v: any) => void;
    reject: (e: any) => void;
  }> = [];
  private messageTimer: number | null = null;

  constructor() {
    const handleMessage = (request: any, sender?: any) => {
      if (request.method === 'notifyBackground') {
        request.method = request.reason;
        delete request.reason;
      }
      if (request.method !== APIs.ON_EVENT) {
        return;
      }
      logger.debug(`[nofity:event] ${request.event}`, request);
      this.event.emit(request.event, request);
    };

    browser.runtime.onMessage.addListener((request, sender) => {
      // 批量消息
      if (request.method === 'batchExecute') {
        request.batch.forEach((item) => handleMessage(item));
        return;
      }
      handleMessage(request);
    });
  }

  private startSendMessage() {
    if (this.messageTimer !== null) {
      return;
    }
    this.messageTimer = getGlobal().setTimeout(async () => {
      const currentQueue = this.messageQueue;
      this.messageQueue = [];
      // 只要开始发了，就把timer设置成null
      this.messageTimer = null;
      if (currentQueue.length === 0) {
        return;
      }
      if (currentQueue.length === 1) {
        const first = currentQueue[0];
        browser.runtime.sendMessage(first.request).then(first.resolve).catch(first.reject);
        return;
      }
      // 有多条并行执行
      const messages = currentQueue.map((x) => x.request);
      const result = await browser.runtime.sendMessage({
        method: 'batchExecute',
        batch: messages,
      });
      if (Array.isArray(result)) {
        result.forEach((item, index) => {
          if (item.status === 'rejected') {
            currentQueue[index].reject(item.reason);
          } else {
            currentQueue[index].resolve(item.value);
          }
        });
      }
    });
  }
  sendMessage(request: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.messageQueue.push({ request, resolve, reject });
      this.startSendMessage();
    });
  }

  other(request: any) {
    return this.sendMessage(request);
  }

  background(request: any) {
    return this.sendMessage({ ...request, method: 'notifyBackground', reason: request.method });
  }

  async tabs(request: any, filterTab?: (tab: Tabs.Tab) => boolean) {
    if (IS_ANDROID) {
      const tabs = await browser.tabs.query({});

      return Promise.all(
        tabs.map((tab: Tabs.Tab) => {
          if (!canAccess(tab.url)) {
            return Promise.resolve();
          }
          if (filterTab && !filterTab(tab)) {
            return Promise.resolve();
          }
          return browser.tabs.sendMessage(tab.id!, request);
        }),
      );
    }

    // notify other tabs
    const windows = await browser.windows.getAll({ populate: true });
    return Promise.all(
      windows.map((win) => {
        if (!win.tabs) {
          return Promise.resolve();
        }
        return Promise.all(
          win.tabs.map((tab) => {
            if (!canAccess(tab.url)) {
              return Promise.resolve();
            }
            if (filterTab && !filterTab(tab)) {
              return Promise.resolve();
            }
            return browser.tabs.sendMessage(tab.id!, request);
          }),
        );
      }),
    );
  }
}

const notify = new Notify();

export default notify;
