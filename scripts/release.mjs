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
    ghApi: process.env.GITHUB_API_URL,
    ghRepo: process.env.GITHUB_REPOSITORY,
    ghToken: process.env.GITHUB_TOKEN,
    ghAppId: process.env.GITHUB_APP_ID,
    ghAppSecret: process.env.GITHUB_APP_SECRET,
    version,
    browserConfig,
    tagName,
    releasePath,
    extName: 'header-editor',
    getDescription: ({ current }) => {
      const desc =
        '> `HeaderEditor-xxx-v2` is full version, `HeaderEditor-xxx-v3` is lite version';
      if (typeof current === 'object' && current.body) {
        if (current.body.includes(desc)) {
          return;
        } else {
          return `${current.body}\n\n${desc}`;
        }
      }
      return desc;
    },
  });
};
