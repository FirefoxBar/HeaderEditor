module.exports = {
  externals: {
    react: 'React',
    'react-dom': 'ReactDOM',
  },
  outputDir: 'dist',
  outputAssetsPath: {
    js: 'assets/js',
    css: 'assets/css',
  },
  mpa: true,
  vendor: false,
  browserslist: {
    chrome: 85,
    firefox: 77,
    edge: 85,
  },
  plugins: [
    [
      'build-plugin-css-assets-local',
      {
        outputPath: 'assets/css-assets',
        relativeCssPath: '/',
      },
    ],
    './scripts/webpack/webpack.plugin.js',
  ],
};
