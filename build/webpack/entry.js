const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const entry = [
	{ name: "options", html: true },
	// { name: "popup", html: true },
	// { name: "background", html: false },
]

module.exports = function(root, config) {
	if (config.plugins && Array.isArray(config.plugins)) {
		let hasHtml = false;
		for (const k in config.plugins) {
			const it = config.plugins[k];
			if (typeof (it) === 'object' && it.__proto__.constructor.name === 'HtmlWebpackPlugin') {
				hasHtml = true;
				config.plugins.splice(k, 1);
				break;
			}
		}
		if (hasHtml) {
			entry.forEach(it => {
				if (it.html) {
					config.plugins.push(new HtmlWebpackPlugin({
						inject: true,
						chunks: [it.name],
						template: path.resolve(root, 'src', it.name, 'index.html'),
						filename: it.name + ".html"
					}));
				}
			});
		}
	}
	if (config.entry) {
		config.entry = {};
		entry.forEach(it => config.entry[it.name] = path.resolve(root, 'src', it.name, 'entry.ts'));
	}
	if (config.module && config.module.rules) {
		for (const it of config.module.rules) {
			if (it.loader === "babel-loader") {
				it.options.plugins.push(['babel-plugin-import', {
					libraryName: '@alifd/next',
					style: true
				}]);
				break;
			}
		}
	}
}