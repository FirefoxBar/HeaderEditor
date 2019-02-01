# Header Editor

[![Build Status](
https://img.shields.io/travis/FirefoxBar/HeaderEditor/master.svg?style=flat-square)](https://travis-ci.org/FirefoxBar/HeaderEditor)
[![GitHub release](https://img.shields.io/github/release/FirefoxBar/HeaderEditor.svg?style=flat-square)](https://github.com/FirefoxBar/HeaderEditor/releases)
[![license](https://img.shields.io/github/license/FirefoxBar/HeaderEditor.svg?style=flat-square)](https://github.com/FirefoxBar/HeaderEditor/blob/master/LICENSE)
[![Gitter](https://img.shields.io/gitter/room/FirefoxBar/HeaderEditor.svg?style=flat-square)](https://gitter.im/FirefoxBar/HeaderEditor)

An extension which can modify the request, include request headers, response headers, redirect requests, and cancel requests.

Get this extension from [![Mozilla Add-on](https://img.shields.io/amo/v/header-editor.svg?style=flat-square)](https://addons.mozilla.org/en-US/firefox/addon/header-editor/) and [![Chrome Web Store](https://img.shields.io/chrome-web-store/v/eningockdidmgiojffjmkdblpjocbhgh.svg?style=flat-square)](https://chrome.google.com/webstore/detail/header-editor/eningockdidmgiojffjmkdblpjocbhgh), or [install our self-distributed version](https://github.com/FirefoxBar/HeaderEditor/releases).

For more documentation, Please visit [wiki](https://github.com/FirefoxBar/HeaderEditor/wiki)

## About Permissions

Header Editor require those permissions:

* tabs: Open links or switch to a tab

* webRequest, webRequestBlocking, _all_urls_: Modify the requests

* contextMenus: Add anti-hot-link to right-click menu

* storage, unlimitedStorage: Storage rules and settings

* downloads: Export rules

## Contribution

Contribute codes: [submiting a pull request](https://github.com/FirefoxBar/HeaderEditor/compare)

Translate this extension: [transifex](https://www.transifex.com/sytec/header-editor/)

Thanks to the following personnel for their contribution:

[YFdyh000](https://github.com/yfdyh000)

#### Language maintainers

The following are language maintainers, Thanks for their contribution.

If you have any advice on translations, please contact the maintainer(s) directly.

* en: [ShuangYa](https://github.com/sylingd)

* zh-CN: [ShuangYa](https://github.com/sylingd)

* zh-TW: [zhtw2013](https://github.com/zhtw2013)

* pt-BR: [Kassio Cruz](https://www.transifex.com/user/profile/kassiocs/)

* pl: [Pabli](https://github.com/pabli24)

## How to build

* Install node, npm or yarn. (It is recommended to use yarn, or the build result may be inconsistent with the release version)

* Download source and extract

* Run `yarn` or `npm install`

* Run `yarn build` or `npm run build`

* If you want to enter development mode, please run `yarn watch:dev` or `npm run watch:dev`

## Licenses

Copyright © 2017-2018 [FirefoxBar Team](http://team.firefoxcn.net)

Open source licensed under [GPLv2](LICENSE).