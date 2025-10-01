import { Blob } from 'node:buffer';
import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { URLSearchParams } from 'node:url';
import axios from 'axios';
import { get } from 'lodash-es';
import {
  path as _path,
  extension,
  getDistPath,
  getVersion,
  scriptRoot,
} from './config.mjs';
import { fileExists, readJSON } from './utils.mjs';

function hash(content) {
  const fsHash = createHash('sha256');
  fsHash.update(content);
  return fsHash.digest('hex');
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
  const token = process.env.TOKEN;
  if (!token) {
    console.log('TOKEN not found');
    return;
  }
  if (!process.env.GITHUB_TOKEN) {
    console.log('GITHUB_TOKEN not found');
    return;
  }

  // Get version
  let version = '';
  const browserConfig = await readJSON(
    join(scriptRoot, 'browser-config/browser.config.json'),
  );
  const browserList = Object.keys(browserConfig);
  for (const browser of browserList) {
    const path = getDistPath(browser);
    if (await fileExists(join(path, 'manifest.json'))) {
      version = await getVersion(path);
      console.log(`Get version from ${path}`);
      break;
    }
  }
  if (!version) {
    console.log('version not found');
    return;
  }

  const tagName = process.env.INPUT_RELEASE_TAG || process.env.GITHUB_REF_NAME;
  if (!tagName) {
    console.log('No tag name');
    return;
  }

  // Git basic infos
  const gitName = repo.split('/');
  const gitHubBaseURL =
    process.env.GITHUB_API_URL + '/repos/' + process.env.GITHUB_REPOSITORY;
  const gitHubToken = process.env.GITHUB_TOKEN;
  const gitHubApiHeader = {
    Accept: 'application/vnd.github+json',
    Authorization: 'Bearer ' + gitHubToken,
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
  };

  const assets = [];

  const dirContent = await readdir(_path.release);
  for (const file of dirContent) {
    if (!file.endsWith('.xpi') && !file.endsWith('.crx')) {
      continue;
    }
    const fullPath = join(_path.release, file);
    if (!(await fileExists(fullPath))) {
      continue;
    }
    const fileContent = await readFile(fullPath);
    const info = await readJSON(join(_path.release, file + '-config.json'));
    assets.push({
      id: info.id,
      name: file,
      path: fullPath,
      hash: hash(fileContent),
      content: fileContent,
      config: info,
      url: `https://github.com/${repo}/releases/download/${tagName}/${file}`,
    });
  }

  if (assets.length === 0) {
    console.log('No assets found');
    return;
  }

  // Check if release is exists
  console.log('Get release info...', tagName);
  const res = await axios.get(`${gitHubBaseURL}/releases`, {
    headers: gitHubApiHeader,
  });
  let releaseInfo = res.data.find(x => x.tag_name === tagName);
  if (!releaseInfo) {
    console.log('Release not exists, creating...');
    try {
      const res = await axios.post(
        `${gitHubBaseURL}/releases`,
        {
          owner: gitName[0],
          repo: gitName[1],
          tag_name: tagName,
          name: version,
          body: '',
          draft: false,
          prerelease: false,
        },
        {
          headers: gitHubApiHeader,
        },
      );
      console.log(`Release created: #${res.data.id}`);
      releaseInfo = res.data;
    } catch (e) {
      console.log('fail: ', e.response.status, e.response.data);
      return;
    }
  } else {
    console.log(`Release exists: #${releaseInfo.id} ${releaseInfo.name}`);
  }
  const releaseId = releaseInfo.id;
  const releaseUploadUrl = releaseInfo.upload_url.replace(
    /\/assets(.*)$/,
    '/assets',
  );

  // Upload all assets to release
  for (const it of assets) {
    const fileContent = await readFile(it.path);
    const blob = new Blob([fileContent], {
      type: 'application/octet-stream',
    });
    console.log('Upload file: ' + it.path);
    try {
      await axios.post(
        `${releaseUploadUrl}?name=${encodeURIComponent(it.name)}`,
        blob,
        {
          headers: {
            ...gitHubApiHeader,
            'Content-Type': 'application/octet-stream',
          },
        },
      );
      console.log('success');
    } catch (e) {
      console.log('fail: ', e.response.status, e.response.data);
    }
  }

  // Update release description
  try {
    console.log('Update release description...');
    await axios.patch(
      `${gitHubBaseURL}/releases/${releaseId}`,
      {
        tag_name: tagName,
        name: version,
        draft: false,
        prerelease: false,
      },
      {
        headers: gitHubApiHeader,
      },
    );
    console.log('success');
  } catch (e) {
    console.log('fail: ', e.response.status, e.response.data);
  }

  // notify the update server
  const notifyAssets = assets.map(x => ({
    ...x,
    content: '',
    config: undefined,
    min_version: get(x, 'config.extension.min_version'),
  }));
  console.log('notify the update server', notifyAssets);
  const params = new URLSearchParams({
    token: token,
    name: 'header-editor',
    version,
    assets: JSON.stringify(notifyAssets),
  });
  await axios.post(
    'https://server-api.sylibs.com/ext/update.php',
    params.toString(),
  );
}

main();
