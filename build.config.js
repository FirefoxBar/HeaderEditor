const manifestVer = String(process.env.MANIFEST_VER) || 'v3';
const targetBrowser = String(process.env.TARGET_BROWSER) || 'firefox';

const envConfigs = {
  firefox_v2: {
    MANIFEST_VER: 'v2',
    ENABLE_DNR: true,
    ENABLE_WEB_REQUEST: true,
    ENABLE_EVAL: true,
  },
  firefox_v3: {
    MANIFEST_VER: 'v3',
    ENABLE_DNR: true,
    ENABLE_WEB_REQUEST: true,
    ENABLE_EVAL: false,
  },
  chrome_v2: {
    MANIFEST_VER: 'v2',
    ENABLE_DNR: true,
    ENABLE_WEB_REQUEST: true,
    ENABLE_EVAL: true,
  },
  chrome_v3: {
    MANIFEST_VER: 'v3',
    ENABLE_DNR: true,
    ENABLE_WEB_REQUEST: false,
    ENABLE_EVAL: false,
  },
};

const env = envConfigs[targetBrowser + '_' + manifestVer];
const outputDir = ['dist', targetBrowser, manifestVer].join('_');

module.exports = {
  externals: {
    react: 'React',
    'react-dom': 'ReactDOM',
  },
  define: {
    ...env,
    MANIFEST_VER: manifestVer,
    TARGET_BROWSER: targetBrowser,
  },
  outputDir: outputDir,
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
