module.exports = {
  base: "/",
  title: "Header Editor",
  description: "Header Editor 官网",
  markdown: {
    lineNumbers: true,
    toc: {
      includeLevel: [1, 2, 3]
    }
  },
  plugins: [
    ['vuepress-plugin-baidu-google-analytics', {
      hm: 'eddab75c23e1853a476011bb95a585c9',
      ignore_hash: true
    }]
  ],
  locales: {
    '/': {
      lang: 'zh-CN',
      title: 'Header Editor',
      description: 'Header Editor 官网'
    },
    '/en/': {
      lang: 'en-US',
      title: 'Header Editor',
      description: 'Header Editor offical website'
    },
    '/zh-TW/': {
      lang: 'zh-TW',
      title: 'Header Editor',
      description: 'Header Editor 官网'
    }
  },
  themeConfig: {
    repo: "FirefoxBar/HeaderEditor",
    docsDir: 'docs',
    editLinks: true,
    locales: {
      '/': require('./locales/zh-CN'),
	  '/en/': require('./locales/zh-CN'),
	  '/zh-TW/': require('./locales/zh-TW')
	}
  }
};