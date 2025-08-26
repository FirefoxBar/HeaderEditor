import { rename } from 'node:fs/promises';
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

  const { success, downloadedFiles } = await signAddon({
    xpiPath: zipPath,
    version,
    apiKey: process.env.AMO_KEY,
    apiSecret: process.env.AMO_SECRET,
    id: extensionConfig.id,
    downloadDir: releasePath,
    disableProgressBar: true,
  });
  if (!success) {
    throw new Error('Sign failed');
  }
  if (downloadedFiles.length === 0) {
    throw new Error('No signed addon found');
  }
  console.log(`[xpi] Downloaded: ${downloadedFiles.join(', ')}`);
  const fileName = getOutputFile(extensionConfig.browser, version, 'xpi');
  const outFile = join(releasePath, fileName);
  // Move download file to output dir
  await rename(downloadedFiles[0], outFile);
  console.log(`[xpi] move to ${outFile}`);
  const infoFile = join(releasePath, `${fileName}-config.json`);
  await outputJSON(infoFile, {
    id: extensionConfig.id,
    browser: browserConfig,
    extension: extensionConfig,
  });
  return outFile;
}

export default packXpi;
