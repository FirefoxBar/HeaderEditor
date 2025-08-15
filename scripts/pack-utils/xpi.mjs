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

  const fileName = getOutputFile(extensionConfig.browser, version, 'xpi');
  const outFile = join(releasePath, fileName);
  await submitAddon(rootPath, true, {
    addonId: extensionConfig.id,
    addonVersion: version,
    channel: 'unlisted',
    distFile: zipPath,
    output: outFile,
  });
  console.log('Downloaded signed addon');
  const infoFile = join(releasePath, `${fileName}-config.json`);
  await outputJSON(infoFile, {
    id: extensionConfig.id,
    browser: browserConfig,
    extension: extensionConfig,
  });
  return outFile;
}

export default packXpi;
