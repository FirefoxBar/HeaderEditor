import { rename } from 'fs/promises';
import { getOutputFile, getVersion, join } from '../config.mjs';
import { outputJSON } from '../utils.mjs';
import { submitAddon } from './amo.mjs';

async function packXpi({
  rootPath,
  sourcePath,
  zipPath,
  releasePath,
  browserConfig,
  extensionConfig,
}) {
  const version = await getVersion(sourcePath);

  const { downloadedFiles } = await submitAddon(rootPath, false, {
    id: extensionConfig.id,
    xpiPath: zipPath,
    downloadDir: releasePath,
    channel: 'unlisted',
  });
  if (downloadedFiles.length === 0) {
    throw new Error('No signed addon found');
  }
  console.log(`Downloaded signed addon: ${downloadedFiles.join(', ')}`);
  const fileName = getOutputFile(extensionConfig.browser, version, 'xpi');
  const out = join(releasePath, fileName);
  // Move download file to output dir
  await rename(join(releasePath, downloadedFiles[0]), out);
  const infoFile = join(releasePath, `${fileName}-config.json`);
  await outputJSON(infoFile, {
    id: extensionConfig.id,
    browser: browserConfig,
    extension: extensionConfig,
  });
  return out;
}

export default packXpi;
