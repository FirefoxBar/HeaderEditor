import { getActiveTab } from '@/share/core/utils';
import browser from 'webextension-polyfill';

interface OpenURLOptions {
  method?: string;
  url: string;
  active?: boolean;
}

export function openURL(options: OpenURLOptions) {
  delete options.method;
  return new Promise((resolve) => {
    const doCreate = () => browser.tabs.create(options).then(resolve);
    browser.tabs
      .query({ currentWindow: true, url: options.url })
      .then((tabs) => {
        if (tabs.length) {
          browser.tabs
            .update(tabs[0].id, {
              active: true,
            })
            .then(resolve)
            .catch(doCreate);
        } else {
          getActiveTab().then((tab) => {
            const url = tab.url || '';
            // re-use an active new tab page
            // Firefox may have more than 1 newtab url, so check all
            const isNewTab =
              url.indexOf('about:newtab') === 0 ||
              url.indexOf('about:home') === 0 ||
              url.indexOf('chrome://newtab/') === 0;
            if (isNewTab) {
              browser.tabs
                .update(tab.id, options)
                .then(resolve)
                .catch(doCreate);
            } else {
              doCreate();
            }
          });
        }
      })
      .catch(doCreate);
  });
}
