const fs = require('fs');
const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const copy = [
  {
    "from": "./node_modules/react/umd/react.production.min.js",
    "to": "external/react.min.js"
  },
  {
    "from": "./node_modules/react-dom/umd/react-dom.production.min.js",
    "to": "external/react-dom.min.js"
  },
  {
    "from": "./node_modules/moment/min/moment.min.js",
    "to": "external/moment.min.js"
  },
  {
    "from": "./node_modules/@alifd/theme-1/dist/next.min.css",
    "to": "external/next.min.css"
  },
  {
    "from": "./src/public",
    "to": "assets"
  }
];

module.exports = function(root, config) {
  const { version } = require(path.resolve(root, 'package.json'));
  if (typeof (config.externals) === "undefined") {
    config.externals = {};
  }
  config.externals['react'] = 'window.React';
  config.externals['react-dom'] = 'window.ReactDOM';
  config.externals['moment'] = 'window.moment';
  // 复制externals和静态文件
  if (config.plugins && Array.isArray(config.plugins)) {
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
    if (fs.existsSync(path.resolve(root, 'dist-merge'))) {
      copy.push({
        from: path.resolve(root, 'dist-merge'),
        to: "."
      });
    }
    config.plugins.push(new CopyWebpackPlugin(copy));
  }
}