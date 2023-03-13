# Header Editor

[![Build Status](https://github.com/FirefoxBar/HeaderEditor/actions/workflows/main.yml/badge.svg)
[![GitHub release](https://img.shields.io/github/release/FirefoxBar/HeaderEditor.svg)](https://github.com/FirefoxBar/HeaderEditor/releases)
[![license](https://img.shields.io/github/license/FirefoxBar/HeaderEditor.svg)](https://github.com/FirefoxBar/HeaderEditor/blob/master/LICENSE)

An extension which can modify the request, include request headers, response headers, redirect requests, and cancel requests.

For more documentations, Please visit [documentions](https://he.firefoxcn.net)

## Get this extension

![Firefox Logo](https://cdnjs.cloudflare.com/ajax/libs/browser-logos/73.0.0/firefox/firefox_16x16.png) [Mozilla Add-on](https://addons.mozilla.org/en-US/firefox/addon/header-editor/).

![Chrome Logo](https://cdnjs.cloudflare.com/ajax/libs/browser-logos/73.0.0/chrome/chrome_16x16.png) [Chrome Web Store](https://chrome.google.com/webstore/detail/header-editor/eningockdidmgiojffjmkdblpjocbhgh).

![Firefox Logo](https://cdnjs.cloudflare.com/ajax/libs/browser-logos/73.0.0/firefox/firefox_16x16.png) Install our [self-distributed version](https://github.com/FirefoxBar/HeaderEditor/releases).

## About Permissions

Header Editor require those permissions:

* tabs: Open links or switch to a tab

* webRequest, webRequestBlocking, _all_urls_: Modify the requests

* contextMenus: Add anti-hot-link to right-click menu

* storage, unlimitedStorage: Storage rules and settings

* downloads: Export rules

* unsafe-eval: Custom function require it, code at [src/options/App.vue#L657](https://github.com/FirefoxBar/HeaderEditor/blob/master/src/options/App.vue#L657) and [src/core/rules.js#L23](https://github.com/FirefoxBar/HeaderEditor/blob/master/src/core/rules.js#L23) (The location may change in the future, you can search for the newest location by `new Function`)

## Contribution

Contribute codes: [Submiting a pull request](https://github.com/FirefoxBar/HeaderEditor/compare)

Thanks to the following personnel for their contribution:

* [YFdyh000](https://github.com/yfdyh000)
* [iNaru](https://github.com/Inaru)

### Translation

English: Please submit a issue or pull request for file `build/locales/original.json`

Other: [Transifex](https://www.transifex.com/sytec/header-editor/)

The following are language maintainers, Thanks for their contribution. If you have any advice on translations, please contact the maintainer(s) directly.

* en: [ShuangYa](https://github.com/sylingd)

* zh-CN: [ShuangYa](https://github.com/sylingd)

* zh-TW: [zhtw2013](https://github.com/zhtw2013)

* pt-BR: [Kassio Cruz](https://www.transifex.com/user/profile/kassiocs/)

* pl: [Pabli](https://github.com/pabli24)

## How to build

#### Prepare

* Install node and pnpm.

* Clone this project, or download the source code and extract it.

* Run `pnpm i`.

#### Build

* Run `npm run build`

* Find build result at `/dist`

#### Development

* Run `npm run start`

* Open browser, load extension from `/dist` directory or `/dist/manifest.json`

## Licenses

Copyright © 2017-2023 [FirefoxBar Team](http://team.firefoxcn.net)

Open source licensed under [GPLv2](LICENSE).