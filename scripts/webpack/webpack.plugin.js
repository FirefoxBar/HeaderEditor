module.exports = ({ context, registerCliOption, onGetWebpackConfig }) => {
  onGetWebpackConfig(config => {
    require('./externals')(config, context);
    require('./dev')(config, context);
    require('./remove-html')(config, context);
  });
};
