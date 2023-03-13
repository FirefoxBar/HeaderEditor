const config = require('../config');
const signAddon = require('sign-addon').default;

module.exports = function (zipPath) {
  return signAddon({
    xpiPath: zipPath,
    version: config.version,
    apiKey: config.extension.firefox.mozilla.key,
    apiSecret: process.env[config.extension.firefox.mozilla.secret],
    id: config.extension.firefox.amo,
  });
};
