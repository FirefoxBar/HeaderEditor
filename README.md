# Header Editor

[![GitHub release](https://img.shields.io/github/release/FirefoxBar/HeaderEditor.svg)](https://github.com/FirefoxBar/HeaderEditor/releases)
[![license](https://img.shields.io/github/license/FirefoxBar/HeaderEditor.svg)](https://github.com/FirefoxBar/HeaderEditor/blob/master/LICENSE)

An extension which can modify the request, include request headers, response headers, redirect requests, and cancel requests.

You can get this extension from [Mozilla Add-ons](https://addons.mozilla.org/en-US/firefox/addon/header-editor/) and [Chrome WebStore](https://chrome.google.com/webstore/detail/header-editor/eningockdidmgiojffjmkdblpjocbhgh)。

But if you want to stay up-to-date with the latest developments, you should [install our self-distributed version](https://github.com/FirefoxBar/HeaderEditor/releases).

This is a WebExtension. Require Firefox 52 or later.

For more documentation, Please visit [wiki](https://github.com/FirefoxBar/HeaderEditor/wiki)

## Contribution

You can contribute codes by [submiting a pull request](https://github.com/FirefoxBar/HeaderEditor/compare).

You can also help us to translate this extension on [transifex](https://www.transifex.com/sytec/header-editor/).

## How to build

* Download [WebExt-build-tool](https://github.com/FirefoxBar/WebExt-build-tool) and configure it

* The config of Header Editor is like this:

```javascript
"he": {
	"basic": {
		"dir": "X:/Code/HeaderEditor",
		"output": "{EXT_DIR}/build/output",
		"ignores": [".git", ".vscode", "build", "manifest", ".gitignore", "README.md", "LICENSE", "manifest.json", "manifest_t.json"],
		"custom": "{EXT_DIR}/build/custom.js",
		"version": {
			"firefox": 0,
			"amo": 0,
			"chrome": 0,
			"webstore": 1
		}
	},
	"locales": {
		"dir": "{EXT_DIR}/_locales",
		"type": "transifex",
		"placeholder": "{EXT_DIR}/build/locales_placeholder.json",
		"default": "en",
		"languages": ["zh_CN", "zh_TW", "pt_BR"],
		"editable": "{EXT_DIR}/build/editable.json"
	},
	"ext": {
		"version": "3.0.3",
		"filename": "HeaderEditor-{VERSION}",
		"gecko": {
			"manifest": "{EXT_DIR}/manifest/firefox.json",
			// Omit some information
		},
		"crx": {
			"manifest": "{EXT_DIR}/manifest/chrome.json"
		}
	}
	// Omit some information
}
```

* Run `node build.js he`

## Translators

* en: [ShuangYa](https://github.com/sylingd)

* zh-CN: [ShuangYa](https://github.com/sylingd)

* zh-TW: [zhtw2013](https://github.com/zhtw2013)

* pt-BR: [Kassio Cruz](https://www.transifex.com/user/profile/kassiocs/)

## Licenses

| File/Directory | LICENSE | GitHub |
| ----- | ----- | ----- |
| scripts/browser-polyfill.js | [MPL 2.0](http://mozilla.org/MPL/2.0/) | [mozilla/webextension-polyfill](https://github.com/mozilla/webextension-polyfill) |
| third-party/mdl | [Apache 2.0](https://github.com/google/material-design-lite/blob/mdl-1.x/LICENSE) | [google/material-design-lite](https://github.com/google/material-design-lite) |
| third-party/material-design-icons | [Apache 2.0](https://github.com/google/material-design-icons/blob/master/LICENSE) | [google/material-design-icons](https://github.com/google/material-design-icons) |
| third-party/dialog-polyfill | [BSD 3](https://github.com/GoogleChrome/dialog-polyfill/blob/master/LICENSE) | [GoogleChrome/dialog-polyfill](https://github.com/GoogleChrome/dialog-polyfill) |

**Everything else:**

Copyright © 2017-2018 [FirefoxBar Team](http://team.firefoxcn.net)

Open source licensed under [GPLv2](LICENSE).