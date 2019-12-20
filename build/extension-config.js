const path = require('path');
const root = path.resolve(__dirname, '..');
const pack = path.resolve(root, 'dist-pack');
const dist = path.resolve(pack, 'copy-dist');
const encrypt = path.resolve(root, 'encrypt');
const config = require(path.resolve(root, 'extension.json'));
const package = require(path.resolve(root, 'package.json'));

module.exports = {
	version: package.version,
	repository: package.repository ? package.repository.url : "",
	config,
	resolve: path.resolve,
	root,
	pack,
	packFile: (file) => path.resolve(pack, file),
	manifest: path.resolve(dist, 'manifest.json'),
	dist,
	encrypt: (file) => path.resolve(encrypt, file)
}