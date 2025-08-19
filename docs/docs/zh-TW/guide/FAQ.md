---
title: FAQ
---

## 提示`“Header Editor”已開始偵錯此瀏覽器`

在 Chrome 瀏覽器中，啟用修改回應主體功能後，您會看到此提示。如果您不想看到此提示，您可以：
* 在「選項」中停用「修改回應主體」。
* 在執行 Chrome 瀏覽器時新增 `--silent-debugger-extension-api` 參數。

## 所有規則均無效

在極少數情況下，某些規則可能會因為語法錯誤而無法初始化，導致所有規則都無效。

在這種情況下，您可以使用以下方法找到特定規則並修改或停用它：

Chrome：
* 開啟 `chrome://extensions/?id=eningockdidmgiojffjmkdblpjocbhgh`
* 在右上角啟用“開發者模式”
* 點選“檢查檢視”下的“Service Worker”
* 找到錯誤訊息並檢查 ID、對應規則和錯誤訊息。
![img](https://img11.360buyimg.com/ddimg/jfs/t1/333577/33/836/91910/68a4ab26F2b85cd64/8d6cd3da3b9af51a.jpg)

Firefox：
* 開啟 `about:debugging`
* 找到“Header Editor”，然後點擊右側的“檢查”按鈕。
* 找到對應的規則和錯誤訊息。
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
