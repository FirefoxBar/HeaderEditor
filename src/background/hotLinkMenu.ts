import emitter from 'share/core/emitter';
import { prefs } from 'share/core/storage';
import { IS_ANDROID, t } from 'share/core/utils';
import { browser } from 'webextension-polyfill-ts';
import { openURL } from './utils';

let antiHotLinkMenu: string | number | null = null;

export default function initHotLinkMenu() {
  function toggleAntiHotLinkMenu(has: boolean) {
    if (IS_ANDROID) {
      return;
    }
    if (has && antiHotLinkMenu === null) {
      antiHotLinkMenu = browser.contextMenus.create({
        id: 'add-anti-hot-link',
        type: 'normal',
        title: t('add_anti_hot_link'),
        contexts: ['image'],
      });
    }
    if (!has && antiHotLinkMenu !== null) {
      browser.contextMenus.remove(antiHotLinkMenu);
      antiHotLinkMenu = null;
    }
  }

  if (typeof browser.contextMenus !== 'undefined') {
    browser.contextMenus.onClicked.addListener((info, tab) => {
      if (info.menuItemId === 'add-anti-hot-link') {
        openURL({
          url: `${browser.extension.getURL('options/options.html')}?action=add-anti-hot-link&url=${info.srcUrl}`,
        });
      }
    });
  }

  emitter.on(emitter.EVENT_PREFS_UPDATE, (key: string, val: any) => {
    if (key === 'add-hot-link') {
      toggleAntiHotLinkMenu(val);
    }
  });

  prefs.ready(() => {
    toggleAntiHotLinkMenu(prefs.get('add-hot-link'));
  });
}
