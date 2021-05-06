const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
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

module.exports = function(config) {
  const { version } = require(path.join(root, 'package.json'));
  // 复制externals和静态文件
  copy.push({
    from: './src/manifest.json',
    to: 'manifest.json',
    transform: content => {
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
