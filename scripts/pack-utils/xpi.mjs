import { rename } from 'fs/promises';
import path from 'path';
import { getOutputFile, getVersion, join } from '../config.mjs';
import { getWebExt, outputJSON } from '../utils.mjs';

async function packXpi({
  rootPath,
  sourcePath,
  zipPath,
  releasePath,
  browserConfig,
  extensionConfig,
}) {
  if (!process.env.AMO_KEY) {
    return Promise.reject(new Error('AMO_KEY not found'));
  }
  if (!process.env.AMO_SECRET) {
    return Promise.reject(new Error('AMO_SECRET not found'));
  }

  const version = await getVersion(sourcePath);

  const savedIdPath = path.join(rootPath, '.web-extension-id');
  const savedUploadUuidPath = path.join(rootPath, '.amo-upload-uuid');
  const { signAddon } = await getWebExt('lib/util/submit-addon.js');
  const { downloadedFiles } = await signAddon({
    apiKey: process.env.AMO_KEY,
    apiSecret: process.env.AMO_SECRET,
    id: extensionConfig.id,
    xpiPath: zipPath,
    downloadDir: releasePath,
    savedIdPath,
    savedUploadUuidPath,
    channel: 'unlisted',
    metaDataJson: {
      version: {
        license: 'GPL-2.0-or-later',
      },
    },
  });
  if (downloadedFiles.length === 0) {
    throw new Error('No signed addon found');
  }
  console.log(`Downloaded signed addon: ${downloadedFiles.join(', ')}`);
  const fileName = getOutputFile(extensionConfig.browser, version, 'xpi');
  const out = join(releasePath, fileName);
  // Move download file to output dir
  await rename(downloadedFiles[0], out);
  const infoFile = join(releasePath, `${fileName}-config.json`);
  await outputJSON(infoFile, {
    id: extensionConfig.id,
    browser: browserConfig,
    extension: extensionConfig,
  });
  return out;
}

export default packXpi;
