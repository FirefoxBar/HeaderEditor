const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = function (config, context) {
  // 调试模式下，开启自动重载和自动编译
  if (config.get('mode') === 'development') {
    // config.plugin('reload').use(ChromeExtensionReloader);
    config.devServer.hot(false);
    config.devServer.open(false);
    const devMiddleware = config.devServer.store.get('devMiddleware');
    config.devServer.store.set('devMiddleware', {
      ...devMiddleware,
      writeToDisk: true,
    });
  }

  config.plugin('bundle-analyzer').use(new BundleAnalyzerPlugin({
    analyzerMode: 'static',
    reportFilename: '../temp/bundle-analyze.html',
  }))

  return config;
};
