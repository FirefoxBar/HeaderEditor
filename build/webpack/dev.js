const ChromeExtensionReloader = require('webpack-chrome-extension-reloader');
const hasArgument = require('./utils').hasArgument;

module.exports = function (root, config) {
	// 调试模式下，开启自动重载和自动编译
	if (config.mode === 'development' && hasArgument('w')) {
		if (config.plugins && Array.isArray(config.plugins)) {
			config.plugins.push(new ChromeExtensionReloader());
		}
		config.watch = true;
		config.watchOptions = {
			aggregateTimeout: 500,
          	ignored: ['node_modules', 'bower_components', 'components']
		};
	}
	// 不要自动打开浏览器
	if (config.mode === 'development' && config.devServer) {
		config.devServer.open = false;
	}
	return config;
}