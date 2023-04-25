module.exports = function (config, context) {
  const plugins = config.plugins.values();

  for (const item of plugins) {
    if (item.name.indexOf('HtmlWebpackPlugin_') !== 0) {
      continue;
    }
    const pageName = item.name.substr(18);
    if (pageName === 'background' || pageName.indexOf('inject-') === 0 || pageName.indexOf('worker-') === 0) {
      config.plugins.delete(item.name);
      console.log('Remove html entry: ' + item.name);
    }
  }

  return config;
};
