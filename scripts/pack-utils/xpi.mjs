import { rename, writeFile } from 'fs/promises';
import { version as _version, extension, resolve } from '../config.mjs';
import { signAddon } from 'sign-addon';

async function packXpi(zipPath, outputDir) {
  if (!process.env.AMO_KEY) {
    return Promise.reject(new Error('AMO_KEY not found'));
  }
  if (!process.env.AMO_SECRET) {
    return Promise.reject(new Error('AMO_SECRET not found'));
  }

  const result = await signAddon({
    xpiPath: zipPath,
    version: _version,
    apiKey: process.env.AMO_KEY,
    apiSecret: process.env.AMO_SECRET,
    id: extension.firefox.xpi,
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
  const out = resolve(outputDir, `${extension.dist.replace('{VER}', _version)}.xpi`);
  const idFile = resolve(outputDir, `${extension.dist.replace('{VER}', _version)}.xpi-id.txt`);
  // Move download file to output dir
  await rename(res[0], out);
  await writeFile(idFile, extension.firefox.xpi);
  return out;
}

export default packXpi;
