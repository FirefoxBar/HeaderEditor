module.exports = {
  base: "/",
  title: "Header Editor",
  description: "Header Editor 使用手册",
  markdown: {
    lineNumbers: true,
    toc: {
      includeLevel: [1, 2, 3]
    }
  },
  plugins: [
    '@vuepress/back-to-top',
    ['vuepress-plugin-baidu-google-analytics', {
      hm: 'eddab75c23e1853a476011bb95a585c9',
      ignore_hash: true
    }]
  ],
  locales: {
    '/': {
      lang: 'zh-CN',
      title: 'Header Editor',
      description: 'Header Editor 使用手册'
    },
    '/en/': {
      lang: 'en-US',
      title: 'Header Editor',
      description: 'Header Editor official manual'
    },
    '/zh-TW/': {
      lang: 'zh-TW',
      title: 'Header Editor',
      description: 'Header Editor 使用手册'
    }
  },
  themeConfig: {
    repo: "FirefoxBar/HeaderEditor",
    docsDir: 'docs',
    editLinks: true,
    sidebarDepth: 2,
    searchMaxSuggestions: 10,
    locales: {
      '/': require('./locales/zh-CN'),
      '/en/': require('./locales/en'),
      '/zh-TW/': require('./locales/zh-TW')
    }
  }
};