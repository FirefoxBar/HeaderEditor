---
nav:
  title: 指南
  order: 1
group:
  title: 介绍
  order: 1
title: 安装
order: 1
---

## 安装

请根据您的平台不同，选择不同的安装方式：

| 浏览器 | 安装 |
| --- | --- |
| ![Firefox Logo](https://cdnjs.cloudflare.com/ajax/libs/browser-logos/browser-logos/73.0.0/firefox/firefox_16x16.png) Firefox | [Mozilla Add-on](https://addons.mozilla.org/en-US/firefox/addon/header-editor/) 或 我们的[自分发版本](https://github.com/FirefoxBar/HeaderEditor/releases) |
| ![Chrome Logo](https://cdnjs.cloudflare.com/ajax/libs/browser-logos/73.0.0/chrome/chrome_16x16.png) Chrome | [Chrome Web Store](https://chrome.google.com/webstore/detail/header-editor/eningockdidmgiojffjmkdblpjocbhgh) |
| ![Edge Logo](https://cdnjs.cloudflare.com/ajax/libs/browser-logos/73.0.0/edge/edge_16x16.png) Edge(Chromium) | [Edge Addons](https://microsoftedge.microsoft.com/addons/detail/header-editor/afopnekiinpekooejpchnkgfffaeceko) |

## 功能比较

完整版（Header Editor）和精简版（Header Editor Lite）的功能有以下区别：

* Firefox 浏览器

| 功能 | 完整版 | 精简版 |
| --- | --- | --- |
| 基础功能 | ✅ | ✅ |
| DNR运行模式 | ✅ | ✅ |
| 规则-排除规则 | ✅ | ✅ |
| 自定义函数 | ✅ | ❌ |
| 修改响应体 | ✅ | ❌ |

* Chrome/Edge 浏览器

| 功能 | 完整版 | 精简版 |
| --- | --- | --- |
| 基础功能 | ✅ | ✅ |
| DNR运行模式 | ❌ | ✅ |
| 规则-排除规则 | ✅ | ❌ |
| 自定义函数 | ✅ | ❌ |
| 修改响应体 | ❌ | ❌ |

备注：
* Chrome/Edge 浏览器的排除规则将在后续版本中以其他方式支持，但无法与当前支持方式完全一致，可能需要手动迁移。
* 若不支持对应功能，规则不会生效，但仍然会被保留，您可以等待后续版本支持，或通过“导入和导出”功能，手动迁移到其他浏览器。

## 基本使用

* 点击右上角的HE图标，打开HE管理面板
* 新建规则：点击右下角的添加按钮，填写规则内容后，保存即可。
* 或者，您可以在“导入和导出”中下载他人的规则。

## 从其他类似扩展迁移

我们提供了一个小工具，可以协助你从一些类似的扩展，快速迁移到 Header Editor: [migrate-to-he.firefoxcn.net](https://migrate-to-he.firefoxcn.net/)
