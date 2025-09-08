import { rename } from 'node:fs/promises';
import { setTimeout as sleep } from 'node:timers/promises';
import { signAddon } from 'sign-addon';
import { getOutputFile, getVersion, join } from '../config.mjs';
import { outputJSON } from '../utils.mjs';
import { waitSubmit } from './amo.mjs';

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

  console.log(`[xpi] [${extensionConfig.id}] start signAddon`);
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
  console.log(
    `[xpi] [${extensionConfig.id}] Downloaded: ${downloadedFiles.join(', ')}`,
  );
  const fileName = getOutputFile(extensionConfig.browser, version, 'xpi');
  const outFile = join(releasePath, fileName);
  // Move download file to output dir
  await rename(downloadedFiles[0], outFile);
  console.log(`[xpi] [${extensionConfig.id}] move to ${outFile}`);
  const infoFile = join(releasePath, `${fileName}-config.json`);
  await outputJSON(infoFile, {
    id: extensionConfig.id,
    browser: browserConfig,
    extension: extensionConfig,
  });
  return outFile;
}

export default packXpi;
