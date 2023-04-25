<h1 align="center">
Header Editor
</h1>

[![Release](https://img.shields.io/github/release/FirefoxBar/HeaderEditor.svg?label=Release)](https://github.com/FirefoxBar/HeaderEditor/releases)
[![Chrome Web Store](https://img.shields.io/chrome-web-store/users/eningockdidmgiojffjmkdblpjocbhgh?label=Chrome)](https://chrome.google.com/webstore/detail/header-editor/eningockdidmgiojffjmkdblpjocbhgh)
[![Mozilla Addons](https://img.shields.io/amo/users/header-editor?label=Firefox)](https://addons.mozilla.org/en-US/firefox/addon/header-editor/)
[![license](https://img.shields.io/github/license/FirefoxBar/HeaderEditor.svg?label=License)](https://github.com/FirefoxBar/HeaderEditor/blob/master/LICENSE)
[![Discussions](https://img.shields.io/github/discussions/FirefoxBar/HeaderEditor?label=Discussions)](https://github.com/FirefoxBar/HeaderEditor/discussions)
[![Build Status](https://github.com/FirefoxBar/HeaderEditor/actions/workflows/dev.yml/badge.svg)](https://github.com/FirefoxBar/HeaderEditor/actions/workflows/dev.yml)

An extension which can modify the request, include request headers, response headers, redirect requests, and cancel requests.

It's 100% FREE, no ADs, no data collection.

For more documentations, Please visit [he.firefoxcn.net](https://he.firefoxcn.net)

## Get this extension

![Firefox Logo](https://cdnjs.cloudflare.com/ajax/libs/browser-logos/73.0.0/firefox/firefox_16x16.png) [Mozilla Add-on](https://addons.mozilla.org/en-US/firefox/addon/header-editor/).

![Chrome Logo](https://cdnjs.cloudflare.com/ajax/libs/browser-logos/73.0.0/chrome/chrome_16x16.png) [Chrome Web Store](https://chrome.google.com/webstore/detail/header-editor/eningockdidmgiojffjmkdblpjocbhgh).

![Edge Logo](https://cdnjs.cloudflare.com/ajax/libs/browser-logos/73.0.0/edge/edge_16x16.png) [Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/header-editor/afopnekiinpekooejpchnkgfffaeceko).

![Firefox Logo](https://cdnjs.cloudflare.com/ajax/libs/browser-logos/73.0.0/firefox/firefox_16x16.png) Install our [self-distributed version](https://github.com/FirefoxBar/HeaderEditor/releases).

## About Permissions

Header Editor require those permissions:

* `tabs`: Open links (such as the options page) or switch to a tab

* `webRequest`, `webRequestBlocking`, `_all_urls_`: Modify requests

* `storage`, `unlimitedStorage`: Storage rules and settings

* `unsafe-eval`: Execute custom function, code at [src/share/core/rule-utils.ts#L8](https://github.com/FirefoxBar/HeaderEditor/blob/dev/src/share/core/rule-utils.ts#L8) (may change in the future, you can search for the newest location by `new Function`)

## Contribution

Contribute codes: [Submitting a pull request](https://github.com/FirefoxBar/HeaderEditor/compare)

Thanks to them for their contribution: [YFdyh000](https://github.com/yfdyh000) [iNaru](https://github.com/Inaru)

### Translation

English: Please submit a issue or pull request for file `locale/original/messages.json`

Other language: Please translate them on [Transifex](https://www.transifex.com/sytec/header-editor/)

Please note that some languages (such as zh-Hans) will not be translated on transifex because the browser does not support them, click [here](https://developer.chrome.com/docs/webstore/i18n/#choosing-locales-to-support) to view full list

## How to build

### Build

* Install node (14+) and pnpm.

* Clone this project, or download the source code and extract it.

* Run `pnpm i`.

* Run `npm run build`

* Find build result at `/dist`

#### Development

* Run `npm run start`

* Open browser, load extension from `/dist` directory or `/dist/manifest.json`

## Licenses

Copyright © 2017-2023 [FirefoxBar Team](https://team.firefoxcn.net)

Open source licensed under [GPLv2](LICENSE).
