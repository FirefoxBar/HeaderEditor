import type { RsbuildPlugin } from '@rsbuild/core';
import fs from 'fs/promises';
import path from 'path';
import getManifest from '../browser-config/get-manifest';

const targetBrowser = String(process.env.TARGET_BROWSER) || 'firefox_v3';

const root = path.join(__dirname, '../..');

const { version } = require(path.join(root, 'package.json'));

async function exists(fullPath: string) {
  try {
    await fs.access(fullPath, fs.constants.R_OK);
    return true;
  } catch (e) {
    return false;
  }
}

export const pluginManifest = (): RsbuildPlugin => ({
  name: 'plugin-manifest',

  setup(api) {
    let versionText = version;
    let manifest: any;
    const setup = async () => {
      if (manifest) {
        return;
      }
      // 添加 snapshot 版本号
      const forceVersionFile = path.join(__dirname, '../../temp/version.txt');
      const hasForceVersionFile = await exists(forceVersionFile);
      if (hasForceVersionFile) {
        versionText = (
          await fs.readFile(forceVersionFile, { encoding: 'utf8' })
        ).trim();
        console.log('Got force version: ' + versionText);
      } else {
        console.log('No force version at ' + forceVersionFile);
      }

      // 如果是tag触发的CI，强制用tag的版本号
      if (process.env.GITHUB_REF_TYPE === 'tag') {
        const tagName = process.env.GITHUB_REF_NAME;
        if (/^[0-9]\.[0-9]+\.[0-9]+$/.test(tagName!)) {
          versionText = tagName;
          console.log('Get version from tagName: ' + versionText);
        }
      }

      // 自定义输入版本号的CI
      if (process.env.INPUT_VERSION) {
        versionText = process.env.INPUT_VERSION;
        console.log('Get version from input: ' + versionText);
      }

      const isDev = process.env.NODE_ENV === 'development';
      manifest = getManifest(targetBrowser, {
        dev: isDev,
        version: versionText,
      });
      // manifest v3 环境不要添加 CSP
      if (isDev && manifest.manifest_version !== 3) {
        manifest['content_security_policy'] =
          "script-src 'self' 'unsafe-eval'; object-src 'self'";
      }
    };

    const run = async () => {
      if (!api.context.distPath) {
        return;
      }
      await setup();
      return fs.writeFile(
        path.join(api.context.distPath, 'manifest.json'),
        JSON.stringify(manifest),
      );
    };

    api.onDevCompileDone(() => run());
    api.onAfterBuild(() => run());
  },
});
