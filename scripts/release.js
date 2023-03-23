const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const publishRelease = require('publish-release');

const config = require('./config');

const { extension } = config;

function hash(filePath) {
  const buffer = fs.readFileSync(filePath);
  const fsHash = crypto.createHash('sha256');
  fsHash.update(buffer);
  return fsHash.digest('hex');
}

function main() {
  if (!extension.github.enable) {
    return;
  }
  if (!process.env.GITHUB_REPOSITORY) {
    console.log('GITHUB_REPOSITORY not found');
    return;
  }
  if (!process.env.GITHUB_TOKEN) {
    console.log('GITHUB_TOKEN not found');
    return;
  }

  const assets = [];
  let content = '';

  const files = fs.readdirSync(config.path.release);

  for (const file of files) {
    const fullPath = path.join(config.path.release, file);
    if (fs.statSync(fullPath).isFile()) {
      assets.push(fullPath);
      content += `> ${it} SHA256: ${hash(fullPath)} \n`;
    }
  }
  
  // Get git names
  const gitName = process.env.GITHUB_REPOSITORY.split('/');
  const tagName = extension.github.tag.replace('{VER}', config.version);
  
  publishRelease({
    token: process.env.GITHUB_TOKEN,
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
}

main();