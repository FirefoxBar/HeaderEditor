const fs = require('fs');
const config = require('../config');
const signAddon = require('sign-addon').default;

async function packXpi(zipPath, outputDir) {
  const result = await signAddon({
    xpiPath: zipPath,
    version: config.version,
    apiKey: config.extension.firefox.mozilla.key,
    apiSecret: process.env[config.extension.firefox.mozilla.secret],
    id: config.extension.firefox.xpi,
    downloadDir: outputDir,
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
