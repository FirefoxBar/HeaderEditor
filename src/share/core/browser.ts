import browser from 'webextension-polyfill';
import { IS_FIREFOX } from './build-inject-constant';
export const IS_ANDROID = navigator.userAgent.includes('Android');

export const IS_SUPPORT_STREAM_FILTER =
  ENABLE_WEB_REQUEST &&
  typeof browser.webRequest?.filterResponseData === 'function';

let _browserVersion: number | undefined;
export function getBrowserVersion() {
  if (_browserVersion) {
    return _browserVersion;
  }
  if (IS_FIREFOX) {
    const info = navigator.userAgent.match(/Firefox\/(\d+)/);
    _browserVersion = info ? Number(info[1]) : -1;
    return _browserVersion;
  }
  const brands = (navigator as any).userAgentData.brands;
  const hit = (() => {
    for (const x of ['Chrome', 'Chromium', 'Microsoft Edge']) {
      const it = brands.find((y: any) => y.brand.includes(x));
      if (it) {
        return Number(it.version.split('.')[0]);
      }
    }
  })();
  _browserVersion = hit ?? -1;
  return _browserVersion;
}

// Get Active Tab
export async function getActiveTab() {
  const tabs = await browser.tabs.query({ currentWindow: true, active: true });
  return tabs[0];
}

export function t(
  key: string,
  params?: string[] | string,
  defaultValue?: string,
) {
  const s = browser.i18n.getMessage(key, params);
  if (s) {
    return s;
  }
  if (typeof defaultValue !== 'undefined') {
    return defaultValue;
  }
  return key;
}
