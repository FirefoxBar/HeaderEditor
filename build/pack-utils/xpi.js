const fs = require('fs');
const common = require('../extension-config');
const signAddon = require('sign-addon').default;

module.exports = function (zipPath, outputDir) {
  return new Promise((resolve, reject) => {
    signAddon({
      xpiPath: zipPath,
      version: common.version,
      apiKey: common.config.firefox.mozilla.key,
      apiSecret: process.env[common.config.firefox.mozilla.secret],
      id: common.config.firefox.xpi,
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
          const out = common.resolve(outputDir, common.config.dist.replace('{VER}', common.version) + '.xpi');
          // Move download file to output dir
          fs.renameSync(res[0], out);
          resolve(out);
        } else {
          reject("Sign failed");
        }
      });
  });
}