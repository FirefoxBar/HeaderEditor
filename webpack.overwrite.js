const webpack = require('webpack');
const fs = require('fs');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const entry = [
	{ name: 'options', ext: "tsx", html: true },
	{ name: 'popup', ext: "tsx", html: true },
	{ name: 'background', ext: "js", html: false }
];

module.exports = config => {
	// 多入口支持
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
						template: path.join('./src', it.name, 'index.html')
					}));
				}
			});
		}
	}
	if (config.entry) {
		config.entry = {};
		entry.forEach(it => config.entry[it.name] = path.join('./src', it.name, 'index.' + it.ext));
	}
	return config;
};
