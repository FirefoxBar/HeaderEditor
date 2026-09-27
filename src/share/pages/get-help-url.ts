import { i18n } from 'webextension-polyfill';
import isDarkMode from './is-dark-mode';

const DOC_DEFAULT_LOCALE = 'zh-CN';
const DOC_ALL_LOCALES = ['en-US', 'zh-TW'];
const DOC_HOST = 'https://he.firefoxcn.net/';

const lang = i18n.getUILanguage();
const currentLocale = DOC_ALL_LOCALES.includes(lang) ? lang : 'en-US';
const localePrefix =
  currentLocale !== DOC_DEFAULT_LOCALE ? `${currentLocale}/` : '';

export const getHelpUrl = (path: string = '') => {
  const isDark = isDarkMode() ? 1 : 0;
  const isHtml = !path.endsWith('/');
  return `${DOC_HOST}${localePrefix}${path}${isHtml ? '.html' : ''}?is_dark=${isDark}`;
};
