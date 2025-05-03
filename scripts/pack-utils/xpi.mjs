import { rename, writeFile } from 'fs/promises';
import { getVersion, join } from '../config.mjs';
import { signAddon } from 'sign-addon';

async function packXpi(sourcePath, zipPath, releasePath, browserConfig, itemConfig) {
  if (!process.env.AMO_KEY) {
    return Promise.reject(new Error('AMO_KEY not found'));
  }
  if (!process.env.AMO_SECRET) {
    return Promise.reject(new Error('AMO_SECRET not found'));
  }

  const result = await signAddon({
    xpiPath: zipPath,
    version: await getVersion(sourcePath),
    apiKey: process.env.AMO_KEY,
    apiSecret: process.env.AMO_SECRET,
    id: itemConfig.id,
    downloadDir: outputDir,
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
  const fileName = getOutputFile(itemConfig.browser, _version, 'xpi');
  const out = join(outputDir, fileName);
  const idFile = join(outputDir, `${fileName}-id.txt`);
  // Move download file to output dir
  await rename(res[0], out);
  await writeFile(idFile, itemConfig.id);
  return out;
}

export default packXpi;
