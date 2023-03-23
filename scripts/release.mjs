import { readFile, readdir, stat } from 'fs/promises';
import { join } from 'path';
import { createHash } from 'crypto';
import publishRelease from 'publish-release';
import { extension, path as _path, version } from './config.mjs';

async function hash(filePath) {
  const buffer = await readFile(filePath);
  const fsHash = createHash('sha256');
  fsHash.update(buffer);
  return fsHash.digest('hex');
}

async function main() {
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

  const files = await readdir(_path.release);

  for (const file of files) {
    const fullPath = join(_path.release, file);
    const statResult = await stat(fullPath);
    if (statResult.isFile()) {
      assets.push(fullPath);
      content += `> ${it} SHA256: ${hash(fullPath)} \n`;
    }
  }
  
  // Get git names
  const gitName = process.env.GITHUB_REPOSITORY.split('/');
  const tagName = extension.github.tag.replace('{VER}', version);
  
  publishRelease({
    token: process.env.GITHUB_TOKEN,
    owner: gitName[0],
    repo: gitName[1],
    tag: tagName,
    name: version,
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