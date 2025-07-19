module.exports = ({ context, registerCliOption, onGetWebpackConfig }) => {
  onGetWebpackConfig(config => {
    require('./npm-pkgs')(config, context);
    require('./dev')(config, context);
    require('./remove-html')(config, context);
  });
};
