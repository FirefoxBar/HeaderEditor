import { join } from 'node:path';
import { extension, getDistPath, releasePath, scriptRoot } from './config.mjs';

export const run = async ({ getVersion, readJSON, release }) => {
  if (!extension.github.enable) {
    return;
  }

  const tagName = process.env.INPUT_RELEASE_TAG || process.env.GITHUB_REF_NAME;
  if (!tagName) {
    return;
  }

  const browserConfig = await readJSON(
    join(scriptRoot, 'browser-config/browser.config.json'),
  );
  const browserList = Object.keys(browserConfig);

  let version = '';
  for (const browser of browserList) {
    const path = getDistPath(browser);
    try {
      version = await getVersion(path);
      console.log(`Get version from ${path}`);
      break;
    } catch (_) {
      // ignore
    }
  }

  if (!version) {
    console.log('version not found');
    return;
  }

  return await release({
    token: process.env.TOKEN,
    gitHubApi: process.env.GITHUB_API_URL,
    gitHubRepo: process.env.GITHUB_REPOSITORY,
    gitHubToken: process.env.GITHUB_TOKEN,
    version,
    browserConfig,
    tagName,
    releasePath,
    extName: 'header-editor',
  });
};
