const browserConfig = require('./browser.config.json');

function getOutputFile(browser, version, extension) {
  return ['HeaderEditor', version, browser[browserConfig].MANIFEST_VER].join('-') + '.' + extension;
}

function getDistDir(browser) {
  return ['dist', browser].join('_');
}

module.exports = {
  getOutputFile,
  getDistDir,
};