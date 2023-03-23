import { readFile, readdir, stat } from 'fs/promises';
import { join } from 'path';
import { createHash } from 'crypto';
import publishRelease from 'publish-release';
import { extension, path as _path, version } from './config.mjs';

async function hashFile(filePath) {
  const buffer = await readFile(filePath);
  const fsHash = createHash('sha256');
  fsHash.update(buffer);
  return fsHash.digest('hex');
}

function publishReleasePromise(options) {
  return new Promise((resolve, reject) => {
    publishRelease(options, (err, release) => {
      if (err) {
        reject(err);
      } else {
        resolve(release.html_url);
      }
    });
  });
}

async function publishUpdate(params) {
  const token = process.env.SERVER_TOKEN;
  if (!token) {
    return;
  }
  const query = new URLSearchParams(params);
  query.append('name', 'header-editor');
  query.append('token', token);

  const resp = await fetch('https://ext.firefoxcn.net/api/update.php?' + query.toString());
  return await resp.text();
}

async function main() {
  if (!extension.github.enable) {
    return;
  }
  const repo = process.env.GITHUB_REPOSITORY;
  if (!repo) {
    console.log('GITHUB_REPOSITORY not found');
    return;
  }
  if (!process.env.GITHUB_TOKEN) {
    console.log('GITHUB_TOKEN not found');
    return;
  }

  const assets = [];

  const dirContent = await readdir(_path.release);
  for (const file of dirContent) {
    if (!file.endsWith('.xpi') && !file.endsWith('.crx')) {
      continue;
    }
    const fullPath = join(_path.release, file);
    const idFilePath = join(_path.release, file + '-id.txt');
    const statResult = await stat(fullPath);
    if (statResult.isFile()) {
      const fileHash = await hashFile(fullPath);
      const id = await readFile(idFilePath, {
        encoding: 'utf8',
      });
      assets.push({
        id,
        name: file,
        path: fullPath,
        hash: fileHash,
      });
    }
  }

  // Get git names
  const gitName = repo.split('/');
  const tagName = process.env.GITHUB_REF_NAME;
  await publishReleasePromise({
    token: process.env.GITHUB_TOKEN,
    owner: gitName[0],
    repo: gitName[1],
    tag: tagName,
    name: version,
    notes: assets.map(item => `> ${item.name} SHA256: ${item.hash} \n`).join('\n'),
    draft: false,
    prerelease: false,
    reuseRelease: false,
    reuseDraftOnly: false,
    skipAssetsCheck: false,
    skipDuplicatedAssets: false,
    skipIfPublished: true,
    editRelease: false,
    deleteEmptyTag: false,
    assets: assets.map(item => item.path),
  });

  // update "update info" file
  for (const it of assets) {
    const url = `https://github.com/${repo}/releases/download/${tagName}/${it.name}`;
    const browser = it.name.endsWith('.xpi') ? 'gecko' : 'chrome';
    const result = await publishUpdate({
      id: it.id,
      ver: version,
      url,
      browser,
      hash: it.hash,
    });
    console.log('Publish update info ', it.name, result);
  }
}

main();