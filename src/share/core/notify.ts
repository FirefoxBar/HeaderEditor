import browser, { Tabs } from 'webextension-polyfill';
import { canAccess, IS_ANDROID } from './utils';
import { APIs, EVENTs } from './var';
import EventEmitter from 'eventemitter3';

class Notify {
  public event = new EventEmitter();

  constructor() {
    browser.runtime.onMessage.addListener((request, sender) => {
      if (request.method === 'notifyBackground') {
        request.method = request.reason;
      }
      if (request.method !== APIs.ON_EVENT) {
        return;
      }
      this.event.emit(request.event, request);
    });
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
        })
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
          })
        );
      })
    );
  }

  other(request: any) {
    return browser.runtime.sendMessage(request);
  }

  background(request: any) {
    return browser.runtime.sendMessage({ ...request, method: 'notifyBackground', reason: request.method });
  }
}

const notify = new Notify();

export default notify;