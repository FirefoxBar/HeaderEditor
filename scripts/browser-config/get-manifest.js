const browserConfig = require('./browser.config.json');
const extensionConfig = require('../../extension.json');

const baseManifest = {
  name: '__MSG_extName__',
  short_name: '__MSG_extName__',
  version: null,
  description: '__MSG_description__',
  homepage_url: 'https://he.firefoxcn.net',
  icons: {
    128: 'assets/images/128.png',
  },
  permissions: ['tabs', 'storage', 'unlimitedStorage'],
  default_locale: 'en',
  options_ui: {
    page: 'options.html',
    open_in_tab: true,
  },
};

const action = {
  default_icon: {
    128: 'assets/images/128.png',
  },
  default_title: '__MSG_extButtonTitle__',
  default_popup: 'popup.html',
};

function getManifest(browser, options) {
  const config = browserConfig[browser];
  // copy
  const manifest = JSON.parse(JSON.stringify(baseManifest));

  if (config.MANIFEST_VER === 'v2') {
    manifest.manifest_version = 2;
    manifest.background = {
      scripts: ['assets/js/background.js'],
    };
    manifest.browser_action = action;
  } else {
    manifest.manifest_version = 3;
    manifest.background = {
      service_worker: 'assets/js/background.js',
    };
    manifest.action = action;
  }

  if (config.ENABLE_EVAL) {
    manifest.content_security_policy = "script-src 'self' 'unsafe-eval'; object-src 'self';";
  }

  if (config.ENABLE_WEB_REQUEST) {
    manifest.permissions.push('webRequest', 'webRequestBlocking', '*://*/*');
  }

  if (config.ENABLE_DNR) {
    manifest.permissions.push('declarativeNetRequest');
    manifest.host_permissions = ['*://*/*'];
  }

  if (options && options.dev && browser.startsWith('chrome')) {
    const key = extensionConfig.crx.find((x) => x.browser === browser).public_key;
    if (key) {
      manifest.key = key;
    }
  }

  if (browser.startsWith('firefox')) {
    if (options && options.amo) {
      const id = extensionConfig.amo.find((x) => x.browser === browser).id;
      manifest.browser_specific_settings = {
        gecko: {
          id,
          strict_min_version: '77.0',
        },
      };
    } else {
      const id = extensionConfig.xpi.find((x) => x.browser === browser).id;
      manifest.browser_specific_settings = {
        gecko: {
          id,
          strict_min_version: '77.0',
          update_url:
            config.MANIFEST_VER === 'v2'
              ? 'https://ext.firefoxcn.net/header-editor/install/update.json'
              : 'https://ext.firefoxcn.net/header-editor-v3/install/update.json',
        },
      };
    }
  }

  return manifest;
}

module.exports = getManifest;
