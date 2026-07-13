import { join } from 'node:path';
import getManifest from './browser-config/get-manifest.js';
import {
  getDistPath,
  getOutputFile,
  releasePath,
  root,
  scriptRoot,
  temp,
} from './config.mjs';
import { getNote } from './utils.mjs';

const fileExt = {
  crx: 'crx',
  xpi: 'xpi',
};

export const run = async ({ getVersion, pack, readJSON }) => {
  const extensionConfig = await readJSON(join(root, 'extension.json'));

  let platform = [];
  if (process.env.INPUT_PLATFORM) {
    platform = process.env.INPUT_PLATFORM.split(',');
  } else if (process.env.PACK_PLATFORM) {
    platform = process.env.PACK_PLATFORM.split(',');
  } else {
    platform = Object.keys(extensionConfig.auto).filter(x =>
      Boolean(extensionConfig.auto[x]),
    );
  }

  const browserConfig = await readJSON(
    join(scriptRoot, 'browser-config/browser.config.json'),
  );

  const finalPlatform = [];
  const addPlatform = async name => {
    for (const item of extensionConfig[name]) {
      const distPath = getDistPath(item.browser);
      const version = await getVersion(distPath);
      const finalItem = {
        name,
        dist: distPath,
        output: getOutputFile(
          item.browser,
          version,
          name in fileExt ? fileExt[name] : '1',
        ),
        extensionConfig: item,
        browserConfig: browserConfig[item.browser],
      };
      if (item.priv_key) {
        finalItem.privKey = process.env[item.priv_key];
      }
      finalPlatform.push(finalItem);
    }
  };
  for (const name of platform) {
    await addPlatform(name);
  }

  await pack(
    {
      tempPath: join(temp, 'pack'),
      rootPath: root,
      releasePath,
      msClientID: process.env.MS_CLIENT_ID,
      msApiKey: process.env.MS_API_KEY,
      amoKey: process.env.AMO_KEY,
      amoSecret: process.env.AMO_SECRET,
      cwsClientID: process.env.CWS_CLIENT_ID,
      cwsClientSecret: process.env.CWS_CLIENT_SECRET,
      cwsToken: process.env.CWS_TOKEN,
      getManifest: async item => {
        const version = await getVersion(item.dist);
        return getManifest(item.extensionConfig.browser, {
          dev: false,
          version,
          packer: item.name,
        });
      },
      getNote,
    },
    finalPlatform,
  );
};
