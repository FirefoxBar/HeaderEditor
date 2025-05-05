const targetBrowser = String(process.env.TARGET_BROWSER) || 'firefox_v3';

const envConfigs = require('./scripts/browser-config/browser.config.json');
const { getDistDir } = require('./scripts/browser-config/get-path');

const env = envConfigs[targetBrowser];

module.exports = {
  externals: {
    react: 'React',
    'react-dom': 'ReactDOM',
  },
  define: {
    ...env,
    IS_DEV: process.env.NODE_ENV === 'development',
    TARGET_BROWSER: targetBrowser,
  },
  outputDir: getDistDir(targetBrowser),
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
