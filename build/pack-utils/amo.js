const fs = require('fs');
const merge = require('merge');
const common = require('../extension-config');
const signAddon = require('sign-addon').default;
const exec = require('child_process').exec;

module.exports = function (zipPath, output) {
  return new Promise(resolve => {
    signAddon({
      xpiPath: zipPath,
      version: common.version,
      apiKey: common.config.firefox.mozilla.key,
      apiSecret: process.env[common.config.firefox.mozilla.secret],
      id: common.config.firefox.amo
    })
      .then(resolve);
  });
}