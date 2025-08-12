const browserConfig = require('./browser.config.json');

function getOutputFile(browserKey, version, extension) {
  return (
    ['HeaderEditor', version, browserConfig[browserKey].MANIFEST_VER].join(
      '-',
    ) +
    '.' +
    extension
  );
}

function getDistDir(browser) {
  return ['dist', browser].join('_');
}

module.exports = {
  getOutputFile,
  getDistDir,
};
