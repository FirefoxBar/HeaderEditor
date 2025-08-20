declare const MANIFEST_VER: 'v2' | 'v3';
declare const ENABLE_DNR: boolean;
declare const ENABLE_WEB_REQUEST: boolean;
declare const ENABLE_EVAL: boolean;
declare const IS_DEV: boolean;
declare const BROWSER_TYPE: 'firefox' | 'chrome';

declare interface Window {
  IS_BACKGROUND?: boolean;
  browser: any;
}
