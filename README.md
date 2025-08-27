<h1 align="center">
Header Editor
</h1>

[![Release](https://img.shields.io/github/release/FirefoxBar/HeaderEditor.svg?label=Release)](https://github.com/FirefoxBar/HeaderEditor/releases)
[![Chrome Web Store](https://img.shields.io/chrome-web-store/users/eningockdidmgiojffjmkdblpjocbhgh?label=Chrome)](https://chrome.google.com/webstore/detail/header-editor/eningockdidmgiojffjmkdblpjocbhgh)
[![Edge](https://img.shields.io/badge/dynamic/json?label=Edge&query=%24.activeInstallCount&url=https%3A%2F%2Fmicrosoftedge.microsoft.com%2Faddons%2Fgetproductdetailsbycrxid%2Fafopnekiinpekooejpchnkgfffaeceko)](https://microsoftedge.microsoft.com/addons/detail/header-editor/afopnekiinpekooejpchnkgfffaeceko)
[![Mozilla Add-ons](https://img.shields.io/amo/users/header-editor?label=Firefox)](https://addons.mozilla.org/en-US/firefox/addon/header-editor/)
[![Mozilla Add-ons](https://img.shields.io/amo/users/header-editor-lite?label=Firefox(Lite))](https://addons.mozilla.org/en-US/firefox/addon/header-editor-lite/)
[![license](https://img.shields.io/github/license/FirefoxBar/HeaderEditor.svg?label=License)](https://github.com/FirefoxBar/HeaderEditor/blob/master/LICENSE)
[![Discussions](https://img.shields.io/github/discussions/FirefoxBar/HeaderEditor?label=Discussions)](https://github.com/FirefoxBar/HeaderEditor/discussions)
[![Build Status](https://github.com/FirefoxBar/HeaderEditor/actions/workflows/dev.yml/badge.svg)](https://github.com/FirefoxBar/HeaderEditor/actions/workflows/dev.yml)

An extension which can modify the request, include request headers, response headers, response body, redirect requests, and cancel requests.

It's 100% FREE, no ADs, no data collection.

Visit [he.firefoxcn.net](https://he.firefoxcn.net) for more documentations.

## Get this extension

| Browser | Lite | Full |
| --- | --- | --- |
| ![Firefox Logo](https://cdnjs.cloudflare.com/ajax/libs/browser-logos/75.0.1/firefox/firefox_16x16.png) Firefox | [Mozilla Add-ons](https://addons.mozilla.org/en-US/firefox/addon/header-editor-lite/) or our [self-distributed version](https://github.com/FirefoxBar/HeaderEditor/releases) | [Mozilla Add-ons](https://addons.mozilla.org/en-US/firefox/addon/header-editor/) or our [self-distributed version](https://github.com/FirefoxBar/HeaderEditor/releases) |
| ![Chrome Logo](https://cdnjs.cloudflare.com/ajax/libs/browser-logos/75.0.1/chrome/chrome_16x16.png) Chrome | [Chrome Web Store](https://chrome.google.com/webstore/detail/header-editor/eningockdidmgiojffjmkdblpjocbhgh) | [Install full version](https://he.firefoxcn.net/en-US/guide/install-full-version) |
| ![Edge Logo](https://cdnjs.cloudflare.com/ajax/libs/browser-logos/75.0.1/edge/edge_16x16.png) Edge | None | [Edge Addons](https://microsoftedge.microsoft.com/addons/detail/header-editor/afopnekiinpekooejpchnkgfffaeceko) |

* `HeaderEditor-xxx-v2` is full version, `HeaderEditor-xxx-v3` is lite version.
* [Diff between lite and full version](https://he.firefoxcn.net/en-US/guide/index.html)

## Permissions

Header Editor require those permissions:

* `tabs`: Open links (such as the options page)

* `webRequest`, `webRequestBlocking`, `declarativeNetRequest`, `*://*/*`: Modify requests

* `storage`, `unlimitedStorage`: Storage rules and settings

* `debugger`: Modify response body in Chrome

* `unsafe-eval`: Execute custom function, code at [src/share/core/rule-utils.ts#L30](https://github.com/FirefoxBar/HeaderEditor/blob/dev/src/share/core/rule-utils.ts#L30) (may change in the future, you can search for the newest location by `new Function`)

## Contribution

Contribute codes: [Submitting a pull request](https://github.com/FirefoxBar/HeaderEditor/compare)

Thanks to them for their contribution: [YFdyh000](https://github.com/yfdyh000) [iNaru](https://github.com/Inaru)

### Translation

English: Please submit a issue or pull request to file `locale/original/messages.json`

Other language: Please translate them on [Transifex](https://app.transifex.com/sytec/header-editor/)

Please note that some languages (such as zh-Hans) will not be translated on transifex because the browser does not support them, [view full list](https://developer.chrome.com/docs/webstore/i18n/#choosing-locales-to-support).

## How to build

### Build

* Install Node.js 20.x and pnpm 9.x.
* Clone this project, or download the source code and extract it.
* Run `pnpm i --frozen-lockfile`.
* Run build command
  * For chrome full version, run `npm run build:chrome_v2`
  * For chrome lite version, run `npm run build:chrome_v3`
  * For firefox full version, run `npm run build:firefox_v2`
  * For firefox lite version, run `npm run build:firefox_v3`
* Find build result at `/dist_*`

#### Development

* Modify `start` command's `TARGET_BROWSER` to the version you want to build

* Run `npm run start`

* Open browser, load extension from `/dist_*` directory or `/dist_*/manifest.json`

## Licenses

Copyright © 2017-2025 [FirefoxBar Team](https://team.firefoxcn.net)

This project is licensed under the ​**GNU GPL v2.0 or later**.

## Technical Sponsorship

CDN acceleration and security protection for this project are sponsored by Tencent EdgeOne.

[![edgeone-logo](https://edgeone.ai/media/34fe3a45-492d-4ea4-ae5d-ea1087ca7b4b.png)](https://edgeone.ai/?from=github)
