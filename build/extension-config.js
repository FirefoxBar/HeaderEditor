const path = require('path');
const root = path.resolve(__dirname, '..');
const encrypt = path.resolve(root, 'encrypt');
const config = require(path.resolve(root, 'extension.json'));
const package = require(path.resolve(root, 'package.json'));

module.exports = {
	version: package.version,
	repository: package.repository ? package.repository.url : "",
	config,
	resolve: path.resolve,
	encrypt: (file) => path.resolve(encrypt, file)
}