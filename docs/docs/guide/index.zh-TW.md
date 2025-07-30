---
nav:
  title: 指南
  order: 1
group:
  title: 介紹
  order: 1
title: 安裝
order: 1
---

## 安裝

请根据您的平台不同，选择不同的安装方式：

| 瀏覽器 | Lite 版 | Full 版 |
| --- | --- |
| ![Firefox Logo](https://cdnjs.cloudflare.com/ajax/libs/browser-logos/75.0.1/firefox/firefox_16x16.png) Firefox | 暫無 | [Mozilla Add-on](https://addons.mozilla.org/en-US/firefox/addon/header-editor/) 或 我們的[自發行版本](https://github.com/FirefoxBar/HeaderEditor/releases) |
| ![Chrome Logo](https://cdnjs.cloudflare.com/ajax/libs/browser-logos/75.0.1/chrome/chrome_16x16.png) Chrome | [Chrome Web Store](https://chrome.google.com/webstore/detail/header-editor/eningockdidmgiojffjmkdblpjocbhgh) | [安裝完整版](./install-full-version.zh-TW.md) |
| ![Edge Logo](https://cdnjs.cloudflare.com/ajax/libs/browser-logos/75.0.1edge/edge_16x16.png) Edge | 暫無 | [Edge Addons](https://microsoftedge.microsoft.com/addons/detail/header-editor/afopnekiinpekooejpchnkgfffaeceko) |

## 功能比較

完整版（Header Editor）和精簡版（Header Editor Lite）的功能不同如下：

* Firefox 瀏覽器

| 功能 | 完整版 |精簡版 |
| --- | --- | --- |
| 基本功能 | ✅ | ✅ |
| DNR模式| ✅ | ✅ |
| 規則 - 排除 - 正規表示式 | ✅ | ✅ |
| 自訂函數 | ✅ | ❌ |
| 修改回應主體 | ✅ | ❌ |

* Chrome/Edge 瀏覽器

| 功能 | 完整版 |精簡版 |
| --- | --- | --- |
| 基本功能 | ✅ | ✅ |
| DNR模式 | ❌ | ✅ |
| 規則 - 排除 - 正規表示式 | ✅ | ❌ |
| 自訂函數 | ✅ | ❌ |
| 修改回應主體 | ❌ | ❌ |

筆記：
* Lite 版本效能較佳，如無特殊需求，建議使用 Lite 版本。
* Chrome/Edge 瀏覽器的「排除」功能將在後續版本中以其他方式支持，但與目前的支援方式不完全一致，可能需要手動遷移。
* 如果不支援相應的功能，**整個規則**將不會生效，但仍會保留。您可以等待後續版本支持，或透過「匯入匯出」手動遷移到其他瀏覽器。

## 基本使用

* 点击右上角的HE图标，打开HE管理面板
* 在规则界面新建规则：点击右下角的添加按钮，填写规则内容后，保存即可。
* 或者，您可以在“导入和导出”中下载他人的规则。

## 從其他類似擴展遷移

我們提供了一個小工具，可以協助你從一些類似的擴展，快速遷移到 Header Editor: [migrate-to-he.firefoxcn.net](https://migrate-to-he.firefoxcn.net/index_zh_tw.html)
