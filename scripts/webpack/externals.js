const path = require('path');
const fs = require('fs');
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

  // 添加 snapshot 版本号
  let versionText = version;
  const snapshotFile = path.join(__dirname, '../../temp/snapshot-version.txt');
  if (fs.existsSync(snapshotFile)) {
    const snapshotVersion = fs.readFileSync(snapshotFile, { encoding: 'utf8' }).trim();
    versionText += '.' + snapshotVersion;
    console.log('Got snapshot version: ' + snapshotVersion);
  } else {
    console.log('No snapshot version ' + snapshotFile);
  }

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
      jsonContent.version = versionText;

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
