---
title: Setup
---

## Install

Please choose a different installation method depending on your browser:

| | Browser | Lite Version | Full Version |
| --- | --- | --- | --- |
| ![Firefox Logo](https://cdnjs.cloudflare.com/ajax/libs/browser-logos/75.0.1/firefox/firefox_16x16.png) | Firefox | [Official Download](https://github.com/FirefoxBar/HeaderEditor/releases) or [Mozilla Add-ons](https://addons.mozilla.org/en-US/firefox/addon/header-editor-lite/)  | [Official Download](https://github.com/FirefoxBar/HeaderEditor/releases) or [Mozilla Add-ons](https://addons.mozilla.org/en-US/firefox/addon/header-editor/) |
| ![Chrome Logo](https://cdnjs.cloudflare.com/ajax/libs/browser-logos/75.0.1/chrome/chrome_16x16.png) | Chrome | [Chrome Web Store](https://chrome.google.com/webstore/detail/header-editor/eningockdidmgiojffjmkdblpjocbhgh) | [Install full version](./install-full-version) |
| ![Edge Logo](https://cdnjs.cloudflare.com/ajax/libs/browser-logos/75.0.1/edge/edge_16x16.png) | Edge | None | [Edge Addons](https://microsoftedge.microsoft.com/addons/detail/header-editor/afopnekiinpekooejpchnkgfffaeceko) |

* The official download is exactly the same as Mozilla Add-ons, but the Mozilla Add-ons review is very slow, usually taking more than a week, and you may not be able to get the latest version.
* `HeaderEditor-xxx-v2` is full version, `HeaderEditor-xxx-v3` is lite version.

## Features Comparison

The features of the full version (Header Editor) and the lite version (Header Editor Lite) are different as follows:

* Firefox browser

| Feature | Full | Lite |
| --- | --- | --- |
| Basic functions | ✅ | ✅ |
| DNR mode | ✅ | ✅ |
| Rules - Exclude - Regular Expression | ✅ | ✅ |
| Custom functions | ✅ | ❌ |
| Modify response body | ✅ | ✅ |

* Chrome/Edge browser

| Feature | Full | Lite |
| --- | --- | --- |
| Basic functions | ✅ | ✅ |
| DNR mode | ❌ | ✅ |
| Rules - Exclude - Regular Expression | ✅ | ❌ |
| Custom functions | ✅ | ❌ |
| Modify response body | ✅ | ✅ |

Notes:
* The DNR mode has better performance. If there is no specific requirement, it is recommended to use the Lite version.
* If the corresponding feature is not supported, **the entire rule** will not take effect, but will still be retained. You can wait for subsequent versions to support it, or manually migrate to other browsers through the "Import and Export".

## Basic usage

* Click the HE icon in the upper right corner of your browser to open the HE Management Panel
* Create a new rule: Click the Add button in the lower right corner, fill in the rules, and save.
* Alternatively, you can download the rules of others in "Import and Export".

## Migrate from other similar extensions

We provide a small tool that can help you migrate from other similar extensions to Header Editor: [migrate-to-he.firefoxcn.net](https://migrate-to-he.firefoxcn.net/index_en.html)
