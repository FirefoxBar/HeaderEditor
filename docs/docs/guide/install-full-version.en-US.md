---
group: Introduction
title: Install Full Version
order: 2
---

# Install Full Version

> Firefox users can install the full version directly from AMO; Edge users can install the full version from Edge Addons. Chrome users please follow the steps below to install

## Install

* Download the latest installation package (crx format) from [this address](https://github.com/FirefoxBar/HeaderEditor/issues/286)
* Open `chrome://extensions/`
* Enable "Developer Mode"
* Drag the downloaded crx file to the extension page

## Enable Extension

If you encounter an issue with extensions not being enabled (common in Google Chrome 86 and above), please follow these steps:

### Windows

You can use one of the following methods:

**Method 1: Registry**

Save the following code as a `.reg` file and double-click to run it. The value `1` can be anything. If you have multiple extensions to enable, add them on a separate line, ensure the leading numbers are unique.

```
Windows Registry Editor Version 5.00

[HKEY_LOCAL_MACHINE\SOFTWARE\Policies\Google\Chrome\ExtensionInstallAllowlist]
"1"="jhigoaelcgmfbidkocglkcnhmfacajle"
```

**Method 2: Group Policy**

Download the latest policy template from the [Google official website](https://support.google.com/chrome/a/answer/7532015?hl=en) and add `jhigoaelcgmfbidkocglkcnhmfacajle` to `ExtensionInstallAllowlist`.

### macOS / Linux

Add `jhigoaelcgmfbidkocglkcnhmfacajle` to `ExtensionInstallAllowlist`.

* macOS users, please refer to [here](https://support.google.com/chrome/a/answer/7517624?hl=en)
* Linux users, please refer to [here](https://support.google.com/chrome/a/answer/7517525?hl=en)
