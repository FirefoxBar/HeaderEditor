const config = require('../config');
const signAddon = require('sign-addon').default;

module.exports = function (zipPath) {
  if (!process.env.AMO_KEY) {
    return Promise.reject(new Error('AMO_KEY not found'));
  }
  if (!process.env.AMO_SECRET) {
    return Promise.reject(new Error('AMO_SECRET not found'));
  }

  return signAddon({
    xpiPath: zipPath,
    version: config.version,
    apiKey: process.env.AMO_KEY,
    apiSecret: process.env.AMO_SECRET,
    id: config.extension.firefox.amo,
  });
};
