const ChromeExtensionReloader = require('webpack-chrome-extension-reloader');

module.exports = function(root, config) {
	// 调试模式下，开启自动重载
	if (config.mode === 'development' && config.plugins && Array.isArray(config.plugins)) {
		config.plugins.push(new ChromeExtensionReloader());
	}
	// 不要自动打开浏览器
	if (config.mode === 'development' && config.devServer) {
		config.devServer.open = false;
	}
	return config;
}