const hasArgument = require('./utils').hasArgument;
const WebpackShellPlugin = require('webpack-shell-plugin');

module.exports = function(root, config) {
	// 修改dev相关选项
	require('./dev')(root, config);
	// externals和静态文件复制
	require('./externals')(root, config);
	// 多入口支持
	require('./entry')(root, config);
	// 不生成bundle分析
	if (config.mode === 'production' && !hasArgument('a')) {
		for (const k in config.plugins) {
			const it = config.plugins[k];
			if (typeof (it) === 'object' && it.__proto__.constructor.name === 'BundleAnalyzerPlugin') {
				config.plugins.splice(k, 1);
				break;
			}
		}
	}
	// 执行命令，移除eval
	if (config.plugins && Array.isArray(config.plugins)) {
		config.plugins.push(new WebpackShellPlugin({
			onBuildEnd: [
				'node build/remove-evals.js'
			],
		}));
	}
	return config;
}