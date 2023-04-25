---
nav: 指南
group:
  title: 高级
  order: 3
title: 自定义函数
order: 1
---

## 综述

使用自定义函数可以实现更灵活的功能。目前为止，自定义函数可以在以下事件中使用：重定向请求、修改请求头、修改响应头。

自定义函数也受匹配规则和排除规则的限制。只有满足匹配规则且不满足排除规则的请求会被自定义函数处理。

自定义函数的优先级不是确定的。可能自定义函数比普通规则更早的作用到请求上，也可能更迟。多个自定义函数的执行顺序也不定。

在可以使用普通规则完成的情况下，请尽量使用普通规则，而不是自定义函数

自定义函数编写**不包括**函数头尾，只包括函数主体。即：

```javascript
function(val, detail) { //不包括这一行
// 你需要编写的部分
} //不包括这一行
```

例如：

![image](https://user-images.githubusercontent.com/5326684/54876966-6bd6c480-4e53-11e9-8e9d-6c950f8b5cd2.png)

自定义函数会传入参数`val`和`detail`，其中`detail`是2.3.0版本新增的参数，请参见页面下方说明。返回类型根据规则类型不同而不同。

## 重定向请求

传入参数为完整URL的字符串，若函数不处理可返回NULL或原参数。例如，下面代码会将请求都加上一个`_test`：

```javascript
if (val.includes('_test.')) {
	return val;
}
let a = val.lastIndexOf('.');
if (a < 0) {
	return val;
} else {
	return val.substr(0, a) + '_test' + val.substr(a);
}
```

自4.0.3起，返回`_header_editor_cancel_`可取消此请求，如：

```javascript
if (val.includes('utm_source')) {
	return '_header_editor_cancel_';
}
```

## 修改请求头和响应头

传入参数为一个数组，包含所有头信息，格式为：`[{"name: "头名称", "value": "头内容"} …… ]`。

因JS传递Object时是引用传递，因此自定义函数不需要任何返回值，只需要修改传入的参数即可生效。例如，此代码会将`User-Agent`加上` HE/2.0.0`：

```javascript
for (const a in val) {
	if (val[a].name.toLowerCase() === 'user-agent') {
		val[a].value += ' HE/2.0.0';
		break;
	}
}
```

注意：浏览器要求value必须是String，即：

```javascript
let value = 123;
val.push({"name": "test", "value": value}); //不合法，因为value是number
val.push({"name": "test", "value": value.toString()}); //合法
```

## detail对象

自2.3.0开始，自定义函数增加参数`detail`，用于实现更精确的控制

此参数为Object，且为只读参数。结构如下：

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
	// 如果开启了“在自定义函数中包含请求头”且此次触发是在响应时，则此处是请求时的头信息，可能为null，自4.1.0可用
	requestHeaders: null
}
```

可用资源类型见[此处](https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/webRequest/ResourceType)

您可以借此实现一些高级功能，例如，下面的代码只会将example.com域名下的图片和视频重定向到example.org：

```javascript
if (detail.type === "media") {
	return val.replace("example.com", "example.org");
}
```

## 如何调试自定义函数

所有自定义函数的运行均位于后台页面，因此，要调试自定义函数，请打开后台页面的控制台

Chrome：在`chrome://extensions/`中，启用“开发者模式”，点击Header Editor下方的“检查视图”-“背景页”

Firefox：打开`about:debugging`，启用附加组件调试，点击Header Editor下方的“调试”
