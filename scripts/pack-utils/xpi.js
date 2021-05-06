const fs = require('fs');
const config = require('../config');
const signAddon = require('sign-addon').default;

module.exports = function (zipPath, outputDir) {
  return new Promise((resolve, reject) => {
    signAddon({
      xpiPath: zipPath,
      version: config.version,
      apiKey: config.extension.firefox.mozilla.key,
      apiSecret: process.env[config.extension.firefox.mozilla.secret],
      id: config.extension.firefox.xpi,
      downloadDir: outputDir
    })
      .then(result => {
        if (result.success) {
          const res = result.downloadedFiles;
          if (res.length === 0) {
            reject('No signed addon found');
            return;
          }
          console.log("Downloaded signed addon: " + res.join(', '));
          const out = config.resolve(outputDir, config.extension.dist.replace('{VER}', config.version) + '.xpi');
          // Move download file to output dir
          fs.renameSync(res[0], out);
          resolve(out);
        } else {
          reject("Sign failed");
        }
      });
  });
}