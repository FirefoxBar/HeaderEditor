const fs = require('fs');
const config = require('../config');
const signAddon = require('sign-addon').default;

async function packXpi(zipPath, outputDir) {
  if (!process.env.AMO_KEY) {
    return Promise.reject(new Error('AMO_KEY not found'));
  }
  if (!process.env.AMO_SECRET) {
    return Promise.reject(new Error('AMO_SECRET not found'));
  }

  const result = await signAddon({
    xpiPath: zipPath,
    version: config.version,
    apiKey: process.env.AMO_KEY,
    apiSecret: process.env.AMO_SECRET,
    id: config.extension.firefox.xpi,
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
  const out = config.resolve(outputDir, `${config.extension.dist.replace('{VER}', config.version)}.xpi`);
  // Move download file to output dir
  fs.renameSync(res[0], out);
  return out;
}

module.exports = packXpi;
