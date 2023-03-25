---
group:
  title: 介紹
title: FAQ
order: 2
---

## 为什么“头名称”变成小写了？

[RFC 2616](https://tools.ietf.org/html/rfc2616.html#section-4.2)中写到:

> Each header field consists of a name followed by a colon `(":")` and the field value. Field names are case-insensitive.

因此，从4.0.0开始，Header Editor会将“头名称”变为小写。但自定义函数除外：除了已被其他规则修改的头外，自定义函数获取到的仍然是原始头

## 我能以简单的方式删除头吗?

可以，只需将其修改为`_header_editor_remove_`

## 规则消失

我们已知，在某些情况下，规则会消失或不起作用

**注意：在执行以下所有操作之前，请备份您的Chrome/Firefox配置文件文件夹！**

### 在隐私模式下无作用

小面板和管理页面在Firefox的隐私模式下不能使用。但是主要功能可用。

#### Chrome

* 打开`chrome://extensions/?id=eningockdidmgiojffjmkdblpjocbhgh`，启用“以隐身模式启用”

#### Firefox

* 打开about:debugging，找到Header Editor的内部UUID（例如d52e1cf2-22e5-448d-a882-e68f3211fa76）。
* 打开Firefox选项。
* 转到隐私和安全。
* 将历史记录模式设置为“使用自定义设置”。
* 单击“例外”。
* 粘贴我们的URL：`moz-extension://{Internal UUID}/`（`{Internal UUID}`是您在第一步中找到的Header Editor的内部UUID），例如，`moz-extension://d52e1cf2-22e5-448d-a882-e68f3211fa76/`，然后点击“允许”。
* 单击“保存更改”。

### 规则在Firefox中自动删除

感谢[Thorin-Oakenpants](https://github.com/Thorin-Oakenpants)和[henshin](https://github.com/henshin)

* 打开`about:config`，确保`dom.indexedDB.enabled`为`true`
* 尝试将`extensions.webextensions.keepUuidOnUninstall`更改为true，您的问题是否解决？
* 打开Firefox配置文件文件夹，如果存在许多（一千+或更多）名为prefs-xxxx.js且文件大小为0的文件，请关闭Firefox并将它们删除。

## 还有问题？

请[提交issue](https://github.com/FirefoxBar/HeaderEditor/issues/new/choose)
