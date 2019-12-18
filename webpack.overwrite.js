const overwrite = require('./build/webpack');

module.exports = config => {
  return overwrite(__dirname, config);
};
