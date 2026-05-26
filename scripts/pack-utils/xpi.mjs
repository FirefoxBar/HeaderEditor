import { rename } from 'node:fs/promises';
import { setTimeout as sleep } from 'node:timers/promises';
import { getOutputFile, getVersion, join } from '../config.mjs';
import { outputJSON } from '../utils.mjs';
import { submitAddon, waitSubmit } from './amo.mjs';

async function packXpi({
  rootPath,
  sourcePath,
  zipPath,
  releasePath,
  browserConfig,
  extensionConfig,
}) {
  const version = await getVersion(sourcePath);

  if (waitSubmit.length > 0) {
    const last = waitSubmit[waitSubmit.length - 1];
    // wait 60s for AMO submit
    const nextRun = last + 60000;
    if (Date.now() < nextRun) {
      console.log(
        `[xpi] [${extensionConfig.id}] wait ${nextRun - Date.now()}ms`,
      );
      await sleep(nextRun - Date.now());
    }
  }

  const fileName = getOutputFile(extensionConfig.browser, version, 'xpi');
  const outFile = join(releasePath, fileName);

  await submitAddon(rootPath, false, 'xpi', {
    addonId: extensionConfig.id,
    addonVersion: version,
    channel: 'unlisted',
    distFile: zipPath,
    output: outFile,
  });

  console.log(`[xpi] [${extensionConfig.id}] downloaded to ${outFile}`);
  const infoFile = join(releasePath, `${fileName}-config.json`);
  await outputJSON(infoFile, {
    id: extensionConfig.id,
    browser: browserConfig,
    extension: extensionConfig,
  });
  return outFile;
}

export default packXpi;
