---
title: FAQ
---

## 提示`“Header Editor”已開始偵錯此瀏覽器`

在 Chrome 瀏覽器中，啟用修改回應主體功能後，您會看到此提示。如果您不想看到此提示，您可以：
* 在「選項」中停用「修改回應主體」。
* 在執行 Chrome 瀏覽器時新增 `--silent-debugger-extension-api` 參數。

## 為什麼“標頭名稱”會被縮減為小寫？

[RFC 2616](https://tools.ietf.org/html/rfc2616.html#section-4.2) 規定：

> Each header field consists of a name followed by a colon `(":")` and the field value. Field names are case-insensitive.

因此，從 4.0.0 版本開始，Header Editor 會將“標頭名稱”縮減為小寫。自訂函數除外：自訂函數仍將取得原始 header（除非它已被其他規則修改）。

## 修改回應頭不生效

開發者工具（包括 Chrome 和 Firefox）不會顯示修改後的回應頭。此結果不準確，請以實際結果為準。

例如，將`content-type`修改為`text/plain`可以使網頁顯示為純文本，表示修改成功。然而，開發者工具仍然顯示`text/html`。

![2025-09-03_115619.png](https://img10.360buyimg.com/ddimg/jfs/t1/325127/5/15269/85767/68b7bc80F3d770c5e/45cdb64f42625693.jpg)

## 我能以簡單的方式刪除標頭嗎?

可以，只需將其修改為`_header_editor_remove_`

## 規則消失

我們已知，在某些情況下，規則會消失或不起作用

**注意：在執行以下所有操作之前，請備份您的Chrome/Firefox設定檔資料夾！**

### 在隱私模式下無作用

小面板和管理頁面在Firefox的隱私模式下不能使用。但是主要功能可用。

#### Chrome

* 開啟`chrome://extensions/?id=eningockdidmgiojffjmkdblpjocbhgh`，啟用「在無痕模式中啟用」

#### Firefox

* 開啟about:debugging，找到Header Editor的內部UUID（例如d52e1cf2-22e5-448d-a882-e68f3211fa76）。
* 開啟Firefox選項。
* 前往隱私與安全性。
* 將歷史記錄模式設定為「使用自訂設定」。
* 按一下「例外」。
* 貼上我們的URL：`moz-extension://{Internal UUID}/`（`{Internal UUID}`是您在第一步中找到的Header Editor的內部UUID），例如，`moz-extension://d52e1cf2-22e5-448d-a882-e68f3211fa76/`，然後按一下「允許」。
* 按一下「儲存變更」。

### 規則在Firefox中自動刪除

感謝[Thorin-Oakenpants](https://github.com/Thorin-Oakenpants)和[henshin](https://github.com/henshin)

* 開啟`about:config`，確保`dom.indexedDB.enabled`為`true`
* 嘗試將`extensions.webextensions.keepUuidOnUninstall`變更為true，您的問題是否解決？
* 開啟Firefox設定檔資料夾，如果存在許多（一千+或更多）名為prefs-xxxx.js且檔案大小為0的檔案，請關閉Firefox並將它們刪除。

## 還有問題？

請[提交issue](https://github.com/FirefoxBar/HeaderEditor/issues/new/choose)
