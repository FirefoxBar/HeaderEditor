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
    chrome: 64,
    firefox: 69,
    edge: 79,
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
