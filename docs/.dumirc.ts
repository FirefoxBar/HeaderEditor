import { defineConfig } from 'dumi';

export default defineConfig({
  themeConfig: {
    name: 'Header Editor',
    logo: false,
    footer: false,
    socialLinks: {
      github: 'https://github.com/FirefoxBar/HeaderEditor',
    },
  },
  locales: [
    { id: 'zh-CN', name: '简体中文' },
    { id: 'en-US', name: 'English' },
    { id: 'zh-TW', name: '繁體中文' },
  ],
  analytics: {
    baidu: 'eddab75c23e1853a476011bb95a585c9',
  }
});