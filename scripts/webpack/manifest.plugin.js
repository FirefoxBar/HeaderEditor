const path = require('path');
const fs = require('fs/promises');
const _ = require('lodash');
const getManifest = require('../browser-config/get-manifest');

const targetBrowser = String(process.env.TARGET_BROWSER) || 'firefox_v3';

const root = path.join(__dirname, '../..');

const { version } = require(path.join(root, 'package.json'));

async function exists(path) {
  try {
    await fs.access(fullPath, constants.R_OK);
    return true;
  } catch (e) {
    return false;
  }
}

function ManifestPlugin() {
  return {
    apply: (compiler) => {
      let outputPath;
      let versionText = version;
      let manifest;

      const setup = async () => {
        if (outputPath) {
          return;
        }

        if (_.has(compiler, 'options.output.path') && compiler.options.output.path !== '/') {
          outputPath = compiler.options.output.path;
        }

        if (!outputPath) {
          throw new Error('output.path is not defined. Define output.path.');
        }

        // 添加 snapshot 版本号
        const forceVersionFile = path.join(__dirname, '../../temp/version.txt');
        const hasForceVersionFile = await exists(forceVersionFile);
        if (hasForceVersionFile) {
          versionText = await fs.readFile(forceVersionFile, { encoding: 'utf8' }).trim();
          console.log('Got force version: ' + versionText);
        } else {
          console.log('No force version ' + forceVersionFile);
        }

        // 如果是tag触发的CI，强制用tag的版本号
        if (process.env.GITHUB_REF_TYPE && process.env.GITHUB_REF_TYPE === 'tag') {
          const tagName = process.env.GITHUB_REF_NAME;
          if (/^[0-9]\.[0-9]+\.[0-9]+$/.test(tagName)) {
            versionText = tagName;
          }
        }

        const isDev = _.get(compiler, 'options.mode') === 'development';
        manifest = getManifest(targetBrowser, {
          dev: isDev,
        });
        manifest.version = versionText;
        // manifest v3 环境不要添加 CSP
        if (isDev && manifest.manifest_version !== 3) {
          manifest['content_security_policy'] = "script-src 'self' 'unsafe-eval'; object-src 'self'";
        }
      };

      compiler.hooks.afterEmit.tapPromise('browser-manifest', async () => {
        await setup();

        return fs.writeFile(path.join(outputPath, 'manifest.json'), JSON.stringify(manifest));
      });
    },
  };
}

module.exports = ManifestPlugin;
