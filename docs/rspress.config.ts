import * as path from 'node:path';
import { defineConfig } from 'rspress/config';

export default defineConfig({
  root: path.join(__dirname, 'docs'),
  title: 'Header Editor',
  logoText: 'Header Editor',
  icon: 'https://img11.360buyimg.com/ddimg/jfs/t1/326703/8/3750/3031/689b3984F025bfb7f/25762954ccab7604.jpg',
  logo: {
    light:
      'https://img11.360buyimg.com/ddimg/jfs/t1/326703/8/3750/3031/689b3984F025bfb7f/25762954ccab7604.jpg',
    dark: 'https://img11.360buyimg.com/ddimg/jfs/t1/326703/8/3750/3031/689b3984F025bfb7f/25762954ccab7604.jpg',
  },
  themeConfig: {
    socialLinks: [
      {
        icon: 'github',
        mode: 'link',
        content: 'https://github.com/FirefoxBar/HeaderEditor',
      },
    ],
  },
  lang: 'zh-CN',
  locales: [
    {
      lang: 'zh-CN',
      label: '简体中文',
    },
    {
      lang: 'en-US',
      label: 'English',
    },
    {
      lang: 'zh-TW',
      label: '繁體中文',
    },
  ],
});
