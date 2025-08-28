---
title: 安装
---

## 安装

请根据您的平台不同，选择不同的安装方式：

| | 浏览器 | 精简版(Lite) | 完整版 |
| --- | --- | --- | --- |
| ![Firefox Logo](https://cdnjs.cloudflare.com/ajax/libs/browser-logos/75.0.1/firefox/firefox_16x16.png) | Firefox | [官方下载](https://github.com/FirefoxBar/HeaderEditor/releases) 或 [Mozilla Add-ons](https://addons.mozilla.org/zh-CN/firefox/addon/header-editor-lite/) | [官方下载](https://github.com/FirefoxBar/HeaderEditor/releases) 或 [Mozilla Add-ons](https://addons.mozilla.org/zh-CN/firefox/addon/header-editor/) |
| ![Chrome Logo](https://cdnjs.cloudflare.com/ajax/libs/browser-logos/75.0.1/chrome/chrome_16x16.png) | Chrome | [Chrome Web Store](https://chrome.google.com/webstore/detail/header-editor/eningockdidmgiojffjmkdblpjocbhgh) | [安装完整版](./install-full-version) |
| ![Edge Logo](https://cdnjs.cloudflare.com/ajax/libs/browser-logos/75.0.1/edge/edge_16x16.png) | Edge | 暂无 | [Edge Addons](https://microsoftedge.microsoft.com/addons/detail/header-editor/afopnekiinpekooejpchnkgfffaeceko) |

* 官方下载与 Mozilla Add-ons 完全一致，但 Mozilla Add-ons 审核非常缓慢，通常需要一周以上，您可能无法获取到最新版本。
* `HeaderEditor-xxx-v2`是完整版，`HeaderEditor-xxx-v3`是精简版

## 功能比较

完整版（Header Editor）和精简版（Header Editor Lite）的功能有以下区别：

* Firefox 浏览器

| 功能 | 完整版 | 精简版 |
| --- | --- | --- |
| 基础功能 | ✅ | ✅ |
| DNR运行模式 | ✅ | ✅ |
| 规则-排除-正则表达式 | ✅ | ✅ |
| 自定义函数 | ✅ | ❌ |
| 修改响应体 | ✅ | ✅ |

* Chrome/Edge 浏览器

| 功能 | 完整版 | 精简版 |
| --- | --- | --- |
| 基础功能 | ✅ | ✅ |
| DNR运行模式 | ❌ | ✅ |
| 规则-排除-正则表达式 | ✅ | ❌ |
| 自定义函数 | ✅ | ❌ |
| 修改响应体 | ✅ | ✅ |

备注：
* DNR 模式具有更好的性能。如无特定需求，建议使用 Lite 版本。
* 若不支持对应功能，**整个规则**不会生效，但仍然会被保留，您可以等待后续版本支持，或通过“导入和导出”功能，手动迁移到其他浏览器。

## 基本使用

* 点击右上角的HE图标，打开HE管理面板
* 新建规则：点击右下角的添加按钮，填写规则内容后，保存即可。
* 或者，您可以在“导入和导出”中下载他人的规则。

## 从其他类似扩展迁移

我们提供了一个小工具，可以协助你从一些类似的扩展，快速迁移到 Header Editor: [migrate-to-he.firefoxcn.net](https://migrate-to-he.firefoxcn.net/)
