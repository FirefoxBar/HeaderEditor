---
title: 自定义函数
---

## 综述

使用自定义函数可以实现更灵活的功能。目前为止，自定义函数可以在以下事件中使用：重定向请求、修改请求头、修改响应头。

自定义函数也受匹配规则和排除规则的限制。只有满足匹配规则且不满足排除规则的请求会被自定义函数处理。

注意：
* 规则的执行顺序是不确定的。不要依赖于规则的执行顺序来实现功能。
* 在可以使用普通规则完成的情况下，请尽量使用普通规则，而不是自定义函数

自定义函数编写**不包括**函数头尾，只包括函数主体。即：

```javascript
function customFunction(val, detail) { //不包括这一行
// 你需要编写的部分
} //不包括这一行
```

例如：

![image](https://img13.360buyimg.com/ddimg/jfs/t1/302163/31/25689/8426/68a4ab87Fffa8fbd6/4581fc50eaa1b2dc.jpg)

自定义函数会传入参数 `val` 和 `detail`。其中：
* `val` 根据规则类型不同而不同。
  * 重定向请求时，此参数为完整URL的字符串；
  * 修改请求头和响应头时，此参数为一个数组，包含所有头信息；
  * 修改响应体时，此参数为响应体的字符串。
* `detail` 是2.3.0版本新增的参数。
  * 在大多数情况下，此参数与本页面下方的`detail`对象相同。
  * 在 Chrome 中修改响应体时，此参数有区别；详见[修改响应体](./modify-body)。
* 自定义函数的返回类型根据规则类型不同而不同
  * 重定向请求时，返回值为新URL的字符串；
  * 修改请求头和响应头时，不返回任何值；
  * 修改响应体时，返回值为修改后的响应体字符串；

## 重定向请求

传入参数 `val` 为完整URL的字符串，若函数不处理可返回 `null` 或原参数。例如，下面代码会将`.jpg`均重定向为`.gif`：

```javascript
if (!val.includes('.jpg')) {
	return val;
}
return val.replace('.jpg', '.gif');
```

自4.0.3起，返回 `_header_editor_cancel_` 可取消此请求，如：

```javascript
if (val.includes('utm_source')) {
	return '_header_editor_cancel_';
}
```

## 修改请求头和响应头

传入参数 `val` 为一个数组，包含所有头信息，格式为：`[{"name": "头名称", "value": "头内容"} …… ]`。

该自定义函数不需要任何返回值，只需要修改传入的参数即可生效。例如，此代码会将 `User-Agent` 加上 ` HE/2.0.0`：

```javascript
for (const item of val) {
	if (item.name.toLowerCase() === 'user-agent') {
		item.value += ' HE/2.0.0';
		break;
	}
}
```

注意：浏览器要求value必须是String，即：

```javascript
const value = 123;
val.push({"name": "test", "value": value}); // 不合法，因为 value 是 number
val.push({"name": "test", "value": String(value)}); // 合法
```

## detail 对象

自2.3.0开始，自定义函数增加参数`detail`，用于实现更精确的控制

此参数为 Object，且为只读参数。结构如下：

```javascript
{
	// 请求ID，自4.0.3可用
	id: 1234,
	// 请求地址，如果有跳转，此地址是跳转后的地址
	url: "http://example.com/example_redirected.png",
	// 标签页ID，注意如果用户打开了多个浏览器窗口，这个ID可能会重复，自4.1.0可用
	tab: 2,
	// 请求方式，如GET、POST
	method: "GET",
	// 请求所属的frame ID，自4.1.0可用
	frame: 123,
	// 请求所属的frame的父级ID，自4.1.0可用
	parentFrame: -1,
	// 请求当前的代理信息，可能为null，自4.1.0可用
	proxy: {
		host: "localhost",
		port: 8080
	},
	// 资源类型
	type: "image",
	// 请求发起的时间戳
	time: 1505613357577.7522,
	// 触发此请求的URL，例如在页面A上点击了链接B，则B中可以通过此参数获取到A的地址。可能为空
	originUrl: '',
	// 资源将会被加载到的地址，仅Firefox可用，可能为空
	documentUrl: '',
	// 请求是否来自隐私浏览窗口，仅Firefox可用
	incognito: false,
	// 请求页面容器id，仅Firefox可用
	cookieStoreId: 'firefox-default',
	// 如果开启了“在自定义函数中包含请求头”且此次触发是在响应时，则此处是请求时的头信息，可能为null，自4.1.0可用
	requestHeaders: null
}
```

可用资源类型见[此处](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webRequest/ResourceType)

您可以借此实现一些高级功能，例如，下面的代码只会将example.com域名下的图片和视频重定向到example.org：

```javascript
if (detail.type === "media") {
	return val.replace("example.com", "example.org");
}
```

## 工具函数

自 5.4.2 起，Header Editor 提供了一些工具函数，用于简化自定义函数编写。您可以在自定义函数中通过 `util` 调用它们。例如 `util._.clone(val)`。

类型定义如下：
```ts
declare const util: {
  // lodash 函数
  _: { clone, cloneDeep, cloneDeepWith, cloneWith, difference, differenceBy, differenceWith, eq, first, flatten, get, has, head, isEqual, isEqualWith, last, pick, pickBy, random, set, setWith, uniq, uniqBy, uniqWith },
  // 经过安全封装的 atob/btoa 函数，解决原生仅支持 ASCII 字符集的问题
  atob: (encoding: string, base64: string): string | undefined,
  btoa: (str: string): string,
  uint8ArrayToBase64: (uint8Array: Uint8Array): string,
  // 经过封装的 TextDecoder/TextEncoder
  textDecode: (encoding: string, buffer: Uint8Array): string | undefined,
  textEncode: (text: string): Uint8Array<ArrayBuffer>,
}
```

lodash 函数请参考[官方文档](https://lodash.com/docs/4.17.21)

## 如何调试自定义函数

所有自定义函数的运行均位于后台页面，因此，要调试自定义函数，请打开后台页面的控制台

* Chrome：在`chrome://extensions/`中，启用“开发者模式”，点击 Header Editor 下方的“检查视图”-“背景页”或“Service Worker”
* Firefox：打开`about:debugging`，启用附加组件调试，点击 Header Editor 旁边的“检查”
