---
title: 安裝
---

## 安裝

請根據您的平台不同，選擇不同的安裝方式：

| | 瀏覽器 | 精簡版(Lite) | 完整版 |
| --- | --- | --- | --- |
| ![Firefox Logo](https://cdnjs.cloudflare.com/ajax/libs/browser-logos/75.0.1/firefox/firefox_16x16.png) | Firefox | [官方下載](https://github.com/FirefoxBar/HeaderEditor/releases) 或 [Mozilla Add-ons](https://addons.mozilla.org/en-US/firefox/addon/header-editor-lite/) | [官方下載](https://github.com/FirefoxBar/HeaderEditor/releases) 或 [Mozilla Add-ons](https://addons.mozilla.org/en-US/firefox/addon/header-editor/) |
| ![Chrome Logo](https://cdnjs.cloudflare.com/ajax/libs/browser-logos/75.0.1/chrome/chrome_16x16.png) | Chrome | [Chrome Web Store](https://chrome.google.com/webstore/detail/header-editor/eningockdidmgiojffjmkdblpjocbhgh) | [安裝完整版](./install-full-version) |
| ![Edge Logo](https://cdnjs.cloudflare.com/ajax/libs/browser-logos/75.0.1/edge/edge_16x16.png) | Edge | 暫無 | [Edge Addons](https://microsoftedge.microsoft.com/addons/detail/header-editor/afopnekiinpekooejpchnkgfffaeceko) |

* 官方下載與 Mozilla Add-ons 完全一致，但 Mozilla Add-ons 審核非常緩慢，通常需要一週以上，您可能無法取得最新版本。
* `HeaderEditor-xxx-v2`為完整版，`HeaderEditor-xxx-v3`為精簡版。

## 功能比較

完整版（Header Editor）和精簡版（Header Editor Lite）的功能有以下區別：

* Firefox 瀏覽器

| 功能 | 完整版 | 精簡版 |
| --- | --- | --- |
| Manifest 版本 | v2 | v3 |
| 基礎功能 | ✅ | ✅ |
| DNR 執行模式 | ✅ | ✅ |
| 規則-排除-正規表示式 | ✅ | ✅ |
| 自訂函數 | ✅ | ❌ |
| 修改回應主體 | ✅ | ✅ |

* Chrome/Edge 瀏覽器

| 功能 | 完整版 | 精簡版 |
| --- | --- | --- |
| Manifest 版本 | v2 | v3 |
| 基礎功能 | ✅ | ✅ |
| DNR 執行模式 | ❌ | ✅ |
| 規則-排除-正規表示式 | ✅ | ❌ |
| 自訂函數 | ✅ | ❌ |
| 修改回應主體 | ✅ | ✅ |

備註：
* DNR 模式具有更好的效能。如無特定需求，建議使用 Lite 版本。
* 若不支援對應功能，**整個規則**不會生效，但仍然會被保留，您可以等待後續版本支援，或透過「匯入和匯出」功能，手動遷移到其他瀏覽器。

## 基本使用

* 點擊右上角的 HE 圖示，開啟 HE 管理面板
* 新增規則：點擊右下角的新增按鈕，填寫規則內容後，儲存即可。
* 或者，您可以在「匯入和匯出」中下載他人的規則。

## 從其他類似擴充功能遷移

我們提供了一個小工具，可以協助你從一些類似的擴充功能，快速遷移到 Header Editor: [migrate-to-he.firefoxcn.net](https://migrate-to-he.firefoxcn.net/index_zh_tw.html)
