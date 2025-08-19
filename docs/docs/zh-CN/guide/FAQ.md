---
title: FAQ
---

## 提示`“Header Editor”已开始调试此浏览器`

在 Chrome 上，在启用修改响应体功能时，会看到此提示。如果您不想看到此提示，您可以：
* 在“选项”中禁用“修改响应体”。
* 运行 Chrome 时，添加`--silent-debugger-extension-api`参数。

## 所有规则都不生效

极少数情况下，部分规则因为存在语法问题，会导致初始化失败，致使所有规则都不生效。

此时，您可以通过下列方式找到具体规则，并对其进行修改或禁用：

Chrome:
* 打开`chrome://extensions/?id=eningockdidmgiojffjmkdblpjocbhgh`
* 在右上角开启“开发者模式”
* 点击“检查视图”下方的“Service Worker”
* 找到报错提示，查看错误信息中的ID和对应的规则、错误信息。
![img](https://img11.360buyimg.com/ddimg/jfs/t1/333577/33/836/91910/68a4ab26F2b85cd64/8d6cd3da3b9af51a.jpg)

Firefox:
* 打开`about:debugging`
* 找到“Header Editor”，点击右侧的“检查”按钮
* 找到报错提示，查看规则、错误信息。
![img](https://img13.360buyimg.com/ddimg/jfs/t1/289605/39/18012/32092/68a4ae2cFa61f9a6a/9be7525f36abe945.jpg)

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
