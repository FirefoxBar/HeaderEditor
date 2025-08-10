import { rename } from 'fs/promises';
import { signAddon } from 'sign-addon';
import { getOutputFile, getVersion, join } from '../config.mjs';
import { outputJSON } from '../utils.mjs';

async function packXpi({
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

  const result = await signAddon({
    xpiPath: zipPath,
    version,
    apiKey: process.env.AMO_KEY,
    apiSecret: process.env.AMO_SECRET,
    id: extensionConfig.id,
    downloadDir: releasePath,
    disableProgressBar: true,
  });
  if (!result.success) {
    throw new Error('Sign failed');
  }
  const res = result.downloadedFiles;
  if (res.length === 0) {
    throw new Error('No signed addon found');
  }
  console.log(`Downloaded signed addon: ${res.join(', ')}`);
  const fileName = getOutputFile(itemConfig.browser, version, 'xpi');
  const out = join(releasePath, fileName);
  // Move download file to output dir
  await rename(res[0], out);
  const infoFile = join(releasePath, `${fileName}-config.json`);
  await outputJSON(infoFile, {
    id: itemConfig.id,
    browser: browserConfig,
    extension: extensionConfig,
  });
  return out;
}

export default packXpi;
