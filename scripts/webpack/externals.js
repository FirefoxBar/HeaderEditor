const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const copy = [
  {
    from: './node_modules/react/umd/react.production.min.js',
    to: 'external/react.min.js',
  },
  {
    from: './node_modules/react-dom/umd/react-dom.production.min.js',
    to: 'external/react-dom.min.js',
  },
];

const root = path.join(__dirname, '../..');

module.exports = function (config) {
  const { version } = require(path.join(root, 'package.json'));

  // TODO: 添加 snapshot 版本号
  // let versionText = version;
  // if (process.env.IS_SNAPSHOT && process.env.GITHUB_RUN_ID) {
  //   versionText += '.' + process.env.GITHUB_RUN_ID;
  // }

  // dev 环境复制 development 的 react 资源
  if (config.get('mode') === 'development') {
    copy.forEach((x) => {
      if (x.from.includes('.production.min.js')) {
        x.from = x.from.replace('.production.min.js', '.development.js');
      }
    });
  }

  // 复制 manifest
  copy.push({
    from: './src/manifest.json',
    to: 'manifest.json',
    transform: (content) => {
      const jsonContent = JSON.parse(content);
      jsonContent.version = version;

      if (config.mode === 'development') {
        jsonContent['content_security_policy'] = "script-src 'self' 'unsafe-eval'; object-src 'self'";
      }

      return JSON.stringify(jsonContent);
    },
  });

  // 复制其他静态文件
  config.plugin('copy').use(CopyWebpackPlugin, [copy]);

  // Add manaco into a standalone chunk
  config.optimization.splitChunks({
    chunks: 'all',
    minChunks: 100,
    cacheGroups: {
      default: false,
      monaco: {
        name: 'monaco',
        test: /monaco-editor/,
        enforce: true,
      },
      semi: {
        name: 'semi',
        test: /@douyinfe[/+]semi-/,
        enforce: true,
      },
    },
  });
};
