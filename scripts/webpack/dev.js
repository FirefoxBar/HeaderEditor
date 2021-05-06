const ChromeExtensionReloader = require('webpack-chrome-extension-reloader');

module.exports = function (config, context) {
	// 调试模式下，开启自动重载和自动编译
  if (config.get('mode') === 'development') {
    // config.plugin('reload').use(ChromeExtensionReloader);
    config.devServer.open(false);
    config.devServer.writeToDisk(true);
  }
	return config;
}