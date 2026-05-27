import { join } from 'node:path';
import { extension, getDistPath, releasePath, scriptRoot } from './config.mjs';

export const run = async ({ getVersion, readJSON, release }) => {
  if (!extension.github.enable) {
    return;
  }

  const browserConfig = await readJSON(
    join(scriptRoot, 'browser-config/browser.config.json'),
  );

  let distRootPath = '';
  for (const browser of browserList) {
    const path = getDistPath(browser);
    try {
      await getVersion(path);
      distRootPath = path;
      break;
    } catch (_) {
      // ignore
    }
  }

  return await release({
    token: process.env.TOKEN,
    gitHubApi: process.env.GITHUB_API_URL,
    gitHubRepo: process.env.GITHUB_REPOSITORY,
    gitHubToken: process.env.GITHUB_TOKEN,
    distRootPath,
    browserConfig,
    tagName: process.env.INPUT_RELEASE_TAG || process.env.GITHUB_REF_NAME,
    releasePath,
    extName: 'header-editor',
  });
};
