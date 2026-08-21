import browser from 'webextension-polyfill';

export const IS_ANDROID = navigator.userAgent.includes('Android');
export const IS_FIREFOX = BROWSER_TYPE === 'firefox';
export const IS_CHROME = BROWSER_TYPE === 'chrome';

export const IS_SUPPORT_STREAM_FILTER =
  ENABLE_WEB_REQUEST &&
  typeof browser.webRequest?.filterResponseData === 'function';

// Get Active Tab
export async function getActiveTab() {
  const tabs = await browser.tabs.query({ currentWindow: true, active: true });
  return tabs[0];
}

export function t(key: string, params?: any, defaultValue?: string) {
  const s = browser.i18n.getMessage(key, params);
  if (s) {
    return s;
  }
  if (typeof defaultValue !== 'undefined') {
    return defaultValue;
  }
  return key;
}
