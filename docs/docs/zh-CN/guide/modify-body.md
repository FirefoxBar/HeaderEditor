---
title: 修改响应体
---

## 使用前必读

该功能可以修改请求的响应体。

如果使用了此功能，可能会有以下问题：
* 一定程度上影响访问速度和资源占用。
* 影响部分内容下载。

在 Chrome 上，您会看到`“Header Editor”已开始调试此浏览器`的提示，这是因为HE使用了[chrome.debugger API](https://developer.chrome.com/docs/extensions/reference/api/debugger)。如果您不想看到此提示，您可以：
* 在“选项”中禁用“修改响应体”。
* 运行 Chrome 时，添加`--silent-debugger-extension-api`参数。

## 配置指南

### 不生效配置

在 Chrome 下，以下配置不生效，我们可能会在未来修复：
* 匹配类型-请求方法、资源类型
* 排除规则-请求方法、资源类型

在 Firefox 下，所有配置均有效。

### 编码
HE 默认使用 UTF-8 来解码传输的内容。如果网站并非 UTF-8 编码，则您需要手动指定编码。

请注意，该编码仅用于解码。修改后的响应固定以 UTF-8 编码。

如果您不知道网页使用何种编码，请打开控制台（按F12），切换到 Network/网络 标签，刷新当前页面，观察 Response Headers/响应头 中的 Content-Type。

[完整编码列表](https://developer.mozilla.org/en-US/docs/Web/API/Encoding_API/Encodings)

### 请求阶段

在 Chrome 下，您可以选择在何时拦截请求。
* 请求阶段
  * 请求不会真正发送到服务器，您也无法获取服务端的响应头或响应体。
  * 多数情况下，您可以需要手动配置`Content-Type`。
  * 此阶段拦截性能更高，因为您不需要等待服务端的响应。
* 响应阶段
  * 响应会从服务器获取，您需要等待服务端的响应。
  * 您可以在自定义函数中获取服务器的响应头和响应体。

在 Firefox 下，固定为响应阶段。

### 自定义函数
函数共有两个参数：首个参数为解码后的文本，第二个参数为自定义函数的detail对象。返回修改后的文本。

例如，下面函数，会将网页中的所有“baidu”替换为“Google”
```js
return val.replace(/baidu/g, 'Google');
```

您可以通过`detail.browser`获取浏览器类型，取值为`chrome`或`firefox`。
* 在 Firefox 下，detail 对象与[自定义函数](./custom-function)中一致。
* 在 Chrome 下，detail 对象格式为[Fetch.requestPaused](https://chromedevtools.github.io/devtools-protocol/tot/Fetch/#event-requestPaused)。
