const hasArgument = require('./utils').hasArgument;

module.exports = function (root, config) {
  // 修改dev相关选项
  require('./dev')(root, config);
  // externals和静态文件复制
  require('./externals')(root, config);
  // 多入口支持
  require('./entry')(root, config);
  // 不生成bundle分析
  if (config.mode === 'production' && !hasArgument('a')) {
    for (const k in config.plugins) {
      const it = config.plugins[k];
      if (typeof (it) === 'object' && it.__proto__.constructor.name === 'BundleAnalyzerPlugin') {
        config.plugins.splice(k, 1);
        break;
      }
    }
  }
  // 关闭大小警告
  if (!config.performance) {
    config.performance = {};
  }
  config.performance.maxEntrypointSize = 512000;
  config.performance.maxAssetSize = 512000;
  return config;
}