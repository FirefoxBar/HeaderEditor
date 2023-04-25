import { i18n } from 'webextension-polyfill';
import { LocaleProvider } from '@douyinfe/semi-ui';
import React from 'react';

const allLocales = {};

// @ts-ignore
const context = require.context('@douyinfe/semi-ui/lib/es/locale/source', false, /\.js$/);
context.keys().forEach((key: string) => {
  const locale = context(key);
  if (locale.default) {
    const name = locale.default.code;
    if (typeof allLocales[name] === 'undefined') {
      allLocales[name] = locale.default;
    }
  }
});

// 默认使用 en-US
const lang = i18n.getUILanguage();
const currentLocale = typeof allLocales[lang] === 'object' ? allLocales[lang] : allLocales['en-US'];

const SemiLocale = (props: any) => (
  <LocaleProvider locale={currentLocale}>
    {props.children}
  </LocaleProvider>
);

export default SemiLocale;
