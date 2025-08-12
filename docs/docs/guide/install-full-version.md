---
group: 介绍
title: 安装完整版
order: 2
---

# 安装完整版

> Firefox 可以直接在 AMO 中安装完整版；Edge 用户可以通过 Edge Addons 安装完整版。Chrome 用户请按照下述步骤安装

## 安装

* 从[该地址](https://github.com/FirefoxBar/HeaderEditor/issues/286)下载最新的安装包（crx格式）
* 打开`chrome://extensions/`
* 开启“开发者模式”
* 将下载的crx文件拖拽到扩展页面

## 启用扩展

如您遇到扩展无法启用的问题（常见于 Google Chrome 86+），请按照以下步骤操作：

### Windows

您可以选择下列方式之一：

**方式一 注册表**

将下列代码保存为`.reg`文件，并双击运行。其中，1可以是任意值，若有多个需要启用的扩展，则换行再写，保证前边的序号唯一。

```
Windows Registry Editor Version 5.00

[HKEY_LOCAL_MACHINE\SOFTWARE\Policies\Google\Chrome\ExtensionInstallAllowlist]
"1"="jhigoaelcgmfbidkocglkcnhmfacajle"
```

**方式二 组策略**

在[Google 官网](https://support.google.com/chrome/a/answer/7532015?hl=zh-Hans)上下载最新的政策模板，将`jhigoaelcgmfbidkocglkcnhmfacajle`加入到`ExtensionInstallAllowlist`中

### macOS / Linux

将`jhigoaelcgmfbidkocglkcnhmfacajle`加入到`ExtensionInstallAllowlist`中。

* macOS 用户请参考[此处](https://support.google.com/chrome/a/answer/7517624?hl=zh-Hans)
* Linux 用户请参考[此处](https://support.google.com/chrome/a/answer/7517525?hl=zh-Hans)
