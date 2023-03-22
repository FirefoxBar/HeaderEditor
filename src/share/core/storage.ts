import browser from 'webextension-polyfill';

export function getSync() {
  // For development mode
  if (typeof localStorage !== 'undefined' && localStorage.getItem('storage') === 'local') {
    return browser.storage.local;
  }
  try {
    if ('sync' in browser.storage) {
      return browser.storage.sync;
    }
  } catch (e) {
    // Do nothing
  }
  return browser.storage.local;
}

export function getLocal() {
  return browser.storage.local;
}
