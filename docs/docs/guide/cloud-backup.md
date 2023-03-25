---
nav: 指南
group: 常用功能
title: 云同步
order: 2
---

## 综述

自Header Editor 4.0.5起，支持云同步。

**注意：你需要登录你的浏览器账号（如Firefox账号、Google账号等），并启用浏览器的同步功能**

云同步基于浏览器的同步功能，如Firefox Sync、Chrome Sync等。这意味着，HE并不会在自己的服务器上存储您的备份。您的备份存储在您的浏览器提供商的服务器上（如Mozilla、Google的服务器上）。如果您的浏览器不支持云同步，此功能不会有任何效果。

## 哪些内容会被备份？

您的设置会被自动备份。备份功能仅会备份您的规则，包括分组信息。

## 限制

Firefox和Chrome都有各自的空间限制，大约100KB。如果您的规则过多，上传过程会失败，但您依然可以通过传统方式导入和导出。

就我所知，Chrome还会限制上传频率，也就是说，您**不能**过快的进行上传。

## 其他技术细节

### Chrome/Chromium

* 请查看[chrome.storage API](https://developer.chrome.com/extensions/storage#property-sync)获取更多技术细节。

### Firefox

* 据推测，Firefox会定期进行同步。但您可以通过手动运行，强行进行一次同步。
![](https://user-images.githubusercontent.com/886325/41821498-e081fe7e-77e1-11e8-81de-03a09d826cb9.png)
* 重新安装扩展可能导致同步内容丢失。
* 请查看[browser.storage API](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/storage)获取更多技术细节。
