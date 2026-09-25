import * as path from 'node:path';
import { defineConfig } from 'rspress/config';

const logo =
  'https://img11.360buyimg.com/ddimg/jfs/t1/326703/8/3750/3031/689b3984F025bfb7f/25762954ccab7604.jpg';
const rawLogo =
  'https://raw.githubusercontent.com/FirefoxBar/HeaderEditor/refs/heads/master/public/assets/images/128.png';

export default defineConfig({
  root: path.join(__dirname, 'docs'),
  title: 'Header Editor',
  logoText: 'Header Editor',
  icon: rawLogo,
  logo: {
    light: logo,
    dark: rawLogo,
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
  builderConfig: {
    source: {
      define: {
        BROWSER_TYPE: JSON.stringify('chrome'),
        MANIFEST_VER: JSON.stringify('v3'),
        ENABLE_DNR: JSON.stringify(true),
        ENABLE_WEB_REQUEST: JSON.stringify(true),
        ENABLE_EVAL: JSON.stringify(true),
        IS_DEV: JSON.stringify(true),
      },
    },
    output: {
      externals: [
        ({ request }, callback) => {
          // remove some pkgs from semi
          if (['webextension-polyfill'].includes(request || '')) {
            return callback(undefined, '{}', 'var');
          }
          callback();
        },
      ],
    },
    html: {
      tags: [
        {
          tag: 'script',
          children:
            ';(function(){var c=function(b){document.documentElement.classList.toggle("dark",b);document.documentElement.style.colorScheme=b?"dark":"light"},a=new URLSearchParams(location.search);if(a.has("is_dark"))c("1"===a.get("is_dark"));else{a=localStorage.getItem("rspress-theme-appearance");var d=window.matchMedia("(prefers-color-scheme: dark)").matches;c(a&&"auto"!==a?"dark"===a:d)}})()',
        },
      ],
    },
    plugins: [
      {
        name: 'my-plugin',
        setup: api => {
          api.modifyRsbuildConfig((config: any) => {
            if (Array.isArray(config.html?.tags)) {
              config.html.tags = config.html.tags.filter(
                (tag: any) =>
                  tag.tag !== 'script' ||
                  !tag.children.includes('rspress-theme-appearance'),
              );
            }
          });
        },
      },
    ],
  },
});
