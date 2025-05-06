const CopyWebpackPlugin = require('copy-webpack-plugin');
const ManifestPlugin = require('./manifest.plugin');

const browserConfig = require('../browser-config/browser.config.json');
const targetBrowser = String(process.env.TARGET_BROWSER) || 'firefox_v3';

module.exports = function (config) {
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

  // dev 环境复制 development 的 react 资源
  if (config.get('mode') === 'development') {
    copy.forEach((x) => {
      if (x.from.includes('.production.min.js')) {
        x.from = x.from.replace('.production.min.js', '.development.js');
      }
    });
  }

  // 复制其他静态文件
  config.plugin('copy').use(
    new CopyWebpackPlugin({
      patterns: copy,
    }),
  );

  // Add packages into a standalone chunk
  config.optimization.splitChunks({
    chunks: 'all',
    minChunks: 100,
    cacheGroups: {
      default: false,
      codemirror: {
        name: 'codemirror',
        test: /codemirror/,
        enforce: true,
      },
      semi: {
        name: 'semi',
        test: /@douyinfe[/+]semi-/,
        enforce: true,
      },
    },
  });

  config.plugin('browser-manifest').use(ManifestPlugin);

  // remove some packages
  const baseExternals = {
    react: 'React',
    'react-dom': 'ReactDOM',
  };
  if (browserConfig[targetBrowser].ENABLE_EVAL) {
    config.externals(baseExternals);
  } else {
    config.externals([
      function ({ context, request }, callback) {
        if (['text-encoding'].includes(request)) {
          return callback(null, '{}', 'var');
        }
        callback();
      },
      baseExternals,
    ]);
  }
};
