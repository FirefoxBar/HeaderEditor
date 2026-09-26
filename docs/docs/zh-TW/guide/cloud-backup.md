---
title: 雲同步
---

## 綜述

自Header Editor 4.0.5起，支援雲同步。

**注意：你需要登入你的瀏覽器帳號（如Firefox帳號、Google帳號等），並啟用瀏覽器的同步功能**

雲同步基於瀏覽器的同步功能，如Firefox Sync、Chrome Sync等。這意味著，HE並不會在自己的伺服器上儲存您的備份。您的備份儲存在您的瀏覽器提供商的伺服器上（如Mozilla、Google的伺服器上）。如果您的瀏覽器不支援雲同步，此功能不會有任何效果。

## 哪些內容會被備份？

您的設定會被自動備份。備份功能僅會備份您的規則，包括分組資訊。

## 限制

Firefox和Chrome都有各自的空間限制，大約100KB。如果您的規則過多，上傳過程會失敗，但您依然可以透過傳統方式匯入和匯出。

就我所知，Chrome還會限制上傳頻率，也就是說，您**不能**過快地進行上傳。

## 其他技術細節

### Chrome/Chromium

* 請查看[chrome.storage API](https://developer.chrome.com/extensions/storage#property-sync)取得更多技術細節。

### Firefox

* 據推測，Firefox會定期進行同步。但您可以透過手動執行，強行進行一次同步。
![](https://img12.360buyimg.com/ddimg/jfs/t1/331038/40/854/2134/68a4ab75Fcd087439/c89009381abc82ea.jpg)
* 重新安裝擴充功能可能導致同步內容遺失。
* 請查看[browser.storage API](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/storage)取得更多技術細節。
