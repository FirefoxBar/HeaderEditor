---
title: 安裝完整版
---

# 安裝完整版

* Firefox 可在 AMO 中安裝完整版；
* 截止目前，Edge 使用者可以從 Microsoft Store 中安裝完整版；若未來更新為 Lite 版本，請依照下述步驟安裝；
* Edge / Chrome 使用者請依照下述步驟安裝；

## 安裝

* 從[該位址](https://github.com/FirefoxBar/HeaderEditor/releases)下載最新的安裝包（名為`HeaderEditor-x.x.x-v2.crx`）
* 開啟 `chrome://extensions/` 或 `edge://extensions/`
* 開啟「開發者模式」
* 將下載的 crx 檔案拖曳到擴充功能頁面

## 無法安裝、啟用擴充功能

如您遇到擴充功能無法安裝或無法啟用的問題（常見於 Google Chrome 86+），請依照以下步驟操作：

### Windows

#### Chrome

您可以選擇下列方式之一：

**方式一 註冊表**

將下列程式碼儲存為`.reg`檔案，並雙擊執行。其中，1 可以是任意值，若有多個需要啟用的擴充功能，則換行再寫，保證前面的序號唯一。

```
Windows Registry Editor Version 5.00

[HKEY_LOCAL_MACHINE\SOFTWARE\Policies\Google\Chrome\ExtensionInstallAllowlist]
"1"="jhigoaelcgmfbidkocglkcnhmfacajle"
```

**方式二 群組原則**

在[Google 官網](https://support.google.com/chrome/a/answer/7532015?hl=zh-Hant)上下載最新的政策範本，將`jhigoaelcgmfbidkocglkcnhmfacajle`加入到`ExtensionInstallAllowlist`中

#### Edge

您可以選擇下列方式之一：

**方式一 註冊表**

將下列程式碼儲存為`.reg`檔案，並雙擊執行。其中，1 可以是任意值，若有多個需要啟用的擴充功能，則換行再寫，保證前面的序號唯一。

```
Windows Registry Editor Version 5.00

[HKEY_LOCAL_MACHINE\SOFTWARE\Policies\Microsoft\Edge\ExtensionInstallAllowlist]
"1"="jhigoaelcgmfbidkocglkcnhmfacajle"
```

**方式二 群組原則**

請參照[Microsoft 官網](https://learn.microsoft.com/zh-tw/deployedge/microsoft-edge-manage-extensions-policies#allow-or-block-extensions-in-group-policy)，將`jhigoaelcgmfbidkocglkcnhmfacajle`加入到`ExtensionInstallAllowlist`中

### macOS / Linux

將`jhigoaelcgmfbidkocglkcnhmfacajle`加入到`ExtensionInstallAllowlist`中。

* macOS 使用者請參考[此處](https://support.google.com/chrome/a/answer/7517624?hl=zh-Hant)
* Linux 使用者請參考[此處](https://support.google.com/chrome/a/answer/7517525?hl=zh-Hant)
