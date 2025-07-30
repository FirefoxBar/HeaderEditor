---
group: 介紹
title: 安裝完整版
order: 2
---

# 安裝完整版

> Firefox 可以直接在 AMO 中安裝完整版；Edge 使用者可以透過 Edge Addons 安裝完整版。 Chrome 用戶請依照下述步驟安裝

# 安裝
## 安裝
* 從[該位址](https://github.com/FirefoxBar/HeaderEditor/issues/286)下載最新的安裝包（crx格式）
* 開啟[chrome://extensions/](chrome://extensions/)
* 開啟“開發者模式”
* 將下載的crx檔案拖曳到擴充頁面

## 啟用擴充

如您遇到擴充功能無法啟用的問題（常見於 Google Chrome 86+），請依照下列步驟操作：

### Windows

您可以選擇下列方式之一：

**方式一 註冊表**

將下列程式碼儲存為`.reg`文件，並雙擊運行。其中，1可以是任意值，如果你有多個需要啟用的擴充那就換行再寫一行，保證前邊的序號唯一。

```
Windows Registry Editor Version 5.00

[HKEY_LOCAL_MACHINE\SOFTWARE\Policies\Google\Chrome\ExtensionInstallAllowlist]
"1"="jhigoaelcgmfbocglkcnhmfacajle"
```

**方式二 組策略**

在[Google 官網](https://support.google.com/chrome/a/answer/7532015?hl=zh-Hant)上下載最新的政策模板，將`jhigoaelcgmfbidkocglkcnhmfacajle`加入到`ExtensionInstallAllowlist`中

### macOS / Linux

將`jhigoaelcgmfbidkocglkcnhmfacajle`加入`ExtensionInstallAllowlist`中。

* macOS 使用者請參考[此處](https://support.google.com/chrome/a/answer/7517624?hl=zh-Hant)
* Linux 使用者請參考[此處](https://support.google.com/chrome/a/answer/7517525?hl=zh-Hant)
