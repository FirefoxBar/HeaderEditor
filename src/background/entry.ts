import rules from 'share/core/rules';
import { getDatabase } from 'share/core/storage';
import { getActiveTab } from 'share/core/utils';
import { browser } from 'webextension-polyfill-ts';
import initHotLinkMenu from './hotLinkMenu';
import createRequestHandler from './requestHandler';

window.IS_BACKGROUND = true;

browser.runtime.onMessage.addListener((request, sender) => {
  if (request.method === 'notifyBackground') {
    request.method = request.reason;
  }
  switch (request.method) {
    case 'healthCheck':
      return new Promise(resolve => {
        getDatabase()
          .then(() => {
            resolve(true);
          })
          .catch(() => {
            resolve(false);
          });
      });
    case 'openURL':
      return openURL(request);
    case 'getRules':
      return Promise.resolve(rules.get(request.type, request.options));
    case 'saveRule':
      return rules.save(request.type, request.content);
    case 'deleteRule':
      return rules.remove(request.type, request.id);
    case 'updateCache':
      if (request.type === 'all') {
        return Promise.all([
          rules.updateCache('request'),
          rules.updateCache('sendHeader'),
          rules.updateCache('receiveHeader'),
          rules.updateCache('receiveBody'),
        ]);
      } else {
        return rules.updateCache(request.type);
      }
  }
});

interface OpenURLOptions {
  url: string;
  active?: boolean;
}

function openURL(options: OpenURLOptions) {
  // @ts-ignore
  delete options.method;
  return new Promise(resolve => {
    browser.tabs
      .query({ currentWindow: true, url: options.url })
      .then(tabs => {
        if (tabs.length) {
          browser.tabs
            .update(tabs[0].id, {
              active: true,
            })
            .then(resolve);
        } else {
          getActiveTab().then(tab => {
            const url = tab.url || '';
            // re-use an active new tab page
            // Firefox may have more than 1 newtab url, so check all
            const isNewTab =
              url.indexOf('about:newtab') === 0 ||
              url.indexOf('about:home') === 0 ||
              url.indexOf('chrome://newtab/') === 0;
            if (isNewTab) {
              browser.tabs.create(options).then(resolve);
            } else {
              browser.tabs.update(tab.id, options).then(resolve);
            }
          });
        }
      })
      .catch(e => {
        browser.tabs.create(options).then(resolve);
      });
  });
}

// 开始初始化
createRequestHandler();
initHotLinkMenu(openURL);
