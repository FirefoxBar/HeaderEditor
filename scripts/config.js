const path = require('path');

const root = path.join(__dirname, '..');
const dist = path.join(root, 'dist');

const extension = require(path.join(root, 'extension.json'));
const package = require(path.join(root, 'package.json'));
const manifest = require(path.join(dist, 'manifest.json'));

const pack = path.join(root, 'temp/dist-pack');
const release = path.join(root, 'temp/release');

module.exports = {
  version: manifest.version,
  repository: package.repository ? package.repository.url : "",
  extension,
  resolve: path.join,
  path: { root, dist, pack, release },
}