const path = require('path');
const root = path.resolve(__dirname, '..', '..');
const pack = path.resolve(root, 'dist-pack');
const dist = path.resolve(temp, 'copy-dist');
const encrypt = path.resolve(root, 'encrypt');
const package = require(path.resolve(root, 'package.json'));

module.exports = {
	version: package.version,
	config: package.webextension,
	resolve: path.resolve,
	root,
	pack,
	packFile: (file) => path.resolve(pack, file),
	manifest: path.resolve(pack, 'manifest.json'),
	dist,
	encrypt: (file) => path.resolve(encrypt, file)
}