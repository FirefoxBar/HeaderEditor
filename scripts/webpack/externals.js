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
  if (config.get('mode') === 'development') {
    // dev 环境复制 development 的 react 资源
    copy.forEach((x) => {
      if (x.from.includes('.production.min.js')) {
        x.from = x.from.replace('.production.min.js', '.development.js');
      }
    });
  }
  // 复制externals和静态文件
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
  config.plugin('copy').use(CopyWebpackPlugin, [copy]);
};
