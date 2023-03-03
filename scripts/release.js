const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const publishRelease = require('publish-release');

const rootDir = path.resolve(__dirname, '..');
const config = require('./config');

const output = path.resolve(rootDir, 'dist-pack');

const { extension } = config;

if (!extension.github.enable || !config.repository) {
  console.log('GitHub not enabled');
  process.exit(0);
}

const assets = [];
let content = '';

function hash(filePath) {
  const buffer = fs.readFileSync(filePath);
  const fsHash = crypto.createHash('sha256');
  fsHash.update(buffer);
  return fsHash.digest('hex');
}

fs.readdirSync(config.path.release).forEach((it) => {
  const fullPath = path.resolve(config.path.release, it);
  if (fs.statSync(fullPath).isFile()) {
    assets.push(fullPath);
    content += `> ${it} SHA256: ${hash(fullPath)} \n`;
  }
});

// Get git names
const gitName = config.repository.match(/(\w+)\/(\w+)\.git/);
const tagName = extension.github.tag.replace('{VER}', config.version);

publishRelease({
  token: process.env[extension.github.token],
  owner: gitName[1],
  repo: gitName[2],
  tag: tagName,
  name: config.version,
  notes: content,
  draft: false,
  prerelease: false,
  reuseRelease: false,
  reuseDraftOnly: false,
  skipAssetsCheck: false,
  skipDuplicatedAssets: false,
  skipIfPublished: true,
  editRelease: false,
  deleteEmptyTag: false,
  assets,
}, (err, release) => {
  if (err) {
    console.error('release failed!');
    console.error(err);
  } else {
    console.log(release.html_url);
  }
});
