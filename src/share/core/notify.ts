import browser, { Tabs } from 'webextension-polyfill';
import { canAccess, IS_ANDROID } from './utils';

class Notify {
  async tabs(request: any) {
    if (IS_ANDROID) {
      const tabs = await browser.tabs.query({});

      tabs.forEach((tab: Tabs.Tab) => {
        if (canAccess(tab.url)) {
          browser.tabs.sendMessage(tab.id!, request);
        }
      });
      return;
    }

    // notify other tabs
    const windows = await browser.windows.getAll({ populate: true });
    windows.forEach((win) => {
      if (!win.tabs) {
        return;
      }
      win.tabs.forEach((tab) => {
        if (canAccess(tab.url)) {
          browser.tabs.sendMessage(tab.id!, request);
        }
      });
    });
  }
  background(request: any) {
    return browser.runtime.sendMessage({ ...request, method: 'notifyBackground', reason: request.method });
  }
}

export default new Notify();
