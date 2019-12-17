const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const copy = [
	{
		"from": "./node_modules/react/umd/react.production.min.js",
		"to": "external/react.min.js"
	},
	{
		"from": "./node_modules/react-dom/umd/react-dom.production.min.js",
		"to": "external/react-dom.min.js"
	},
	{
		"from": "./src/public",
		"to": "assets"
	}
];

module.exports = function(root, config) {
	const { version } = require(path.resolve(root, 'package.json'));
	if (typeof (config.externals) === "undefined") {
		config.externals = {};
	}
	config.externals['react'] = 'window.React';
	config.externals['react-dom'] = 'window.ReactDOM';
	// 复制externals和静态文件
	if (config.plugins && Array.isArray(config.plugins)) {
		config.plugins.push(new CopyWebpackPlugin([
			...copy,
			{
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
			},
		]));
	}
}