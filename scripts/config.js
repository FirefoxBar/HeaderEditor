const path = require('path');
const encrypt = path.resolve(root, 'encrypt');
const extension = require(path.resolve(root, 'extension.json'));
const package = require(path.resolve(root, 'package.json'));
const root = path.resolve(__dirname, '..');

const dist = path.resolve(root, 'dist');
const pack = path.resolve(root, 'dist-pack');
const release = path.resolve(pack, release);

module.exports = {
	version: package.version,
	repository: package.repository ? package.repository.url : "",
	extension,
  resolve: path.resolve,
  path: { root, dist, pack, release },
	encrypt: (file) => path.resolve(encrypt, file)
}