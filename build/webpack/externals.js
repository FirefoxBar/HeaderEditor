const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const copy = [
  {
    from: "./node_modules/react/umd/react.production.min.js",
    to: "external/react.min.js"
  },
  {
    from: "./node_modules/react-dom/umd/react-dom.production.min.js",
    to: "external/react-dom.min.js"
  },
  {
    from: "./node_modules/moment/min/moment.min.js",
    to: "external/moment.min.js"
  },
  {
    from: "./src/public",
    to: "assets"
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
    const fontDownloadCache = {};
    copy.push({
      from: "./node_modules/@alifd/next/dist/next.min.css",
      to: "external/next.min.css",
      transform: (buf) => {
        // 将字体本地化
        const basePath = path.resolve(config.output.path, "external");
        const text = Buffer.isBuffer(buf) ? buf.toString() : buf;
        const res = text.replace(/\(([a-z:"\/]+)at\.alicdn\.com\/(.*?)\)/g, (match, s1, s2) => {
          let fullUrl = "https://at.alicdn.com/" + s2;
          if (fullUrl.endsWith('"')) {
            fullUrl = fullUrl.substr(0, fullUrl.length - 1);
          }
          let localFile = path.basename(fullUrl);
          const lastPoint = localFile.lastIndexOf('.');
          localFile = localFile.substr(0, lastPoint) + '.' + localFile.substr(lastPoint + 1).match(/^(\w+)/)[1];
          // 将远程文件下载到本地
          const localPath = path.resolve(basePath, localFile);
          if (!fs.existsSync(localPath)) {
            if (typeof(fontDownloadCache[fullUrl]) === "undefined") {
              fetch(fullUrl)
                .then(res => res.text())
                .then(res => {
                  fontDownloadCache[fullUrl] = res;
                  fs.writeFileSync(localPath, res);
                });
            } else {
              fs.writeFileSync(localPath, fontDownloadCache[fullUrl]);
            }
          }
          return `(./${localFile})`;
        });
        return res;
      }
    });
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