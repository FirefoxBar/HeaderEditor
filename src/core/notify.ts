import { browser, Tabs } from 'webextension-polyfill-ts';
import { canAccess, IS_ANDROID } from './utils';

class Notify {
  tabs(request: any) {
    return new Promise(resolve => {
      if (IS_ANDROID) {
        browser.tabs.query({}).then(tabs => {
          tabs.forEach((tab: Tabs.Tab) => {
            if (canAccess(tab.url)) {
              browser.tabs.sendMessage(tab.id!, request);
            }
          });
          resolve();
        });
      } else {
        // notify other tabs
        browser.windows.getAll({populate: true}).then(windows => {
          windows.forEach(win => {
            if (!win.tabs) {
              return;
            }
            win.tabs.forEach(tab => {
              if (canAccess(tab.url)) {
                browser.tabs.sendMessage(tab.id!, request);
              }
            });
          });
          resolve();
        });
      }
    });
  }
  background(request: any) {
    return browser.runtime.sendMessage(Object.assign({}, request, {
      method: "notifyBackground",
      reason: request.method
    }));
  }
}

export default new Notify();