---
group:
  title: 高級
  order: 3
title: 自訂函數
order: 1
---

## 綜述

使用自訂函數可以實現更靈活的功能。目前為止，自訂函數可以在以下事件中使用：重新導向要求、變更要求標頭、變更回應標頭。

自訂函數也受比較規則和排除規則的限制。只有滿足比較規則且不滿足排除規則的要求會被自訂函數處理。

自訂函數的優先等級不是確定的。可能自訂函數比普通規則更早的作用到要求上，也可能更遲。多個自訂函數的執行順序也不定。

在可以使用普通規則完成的情況下，請盡量使用普通規則，而不是自訂函數

自訂函數編寫**不包括**函數頭尾，只包括函數主體。即：

```javascript
function(val, detail) { //不包括這一行
// 你需要編寫的部分
} //不包括這一行
```

例如：

![image](https://user-images.githubusercontent.com/5326684/54876966-6bd6c480-4e53-11e9-8e9d-6c950f8b5cd2.png)

自訂函數會傳入參數`val`和`detail`，其中`detail`是2.3.0版本新增的參數，請參見頁面下方說明。返回類型根據規則類型不同而不同。

## 重新導向要求

傳入參數為完整URL的字串，若函數不處理可返回NULL或原參數。例如，下面語法會將要求都加上一個`_test`：

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

## 變更要求標頭和回應標頭

傳入參數為一個陣列，包含所有標頭資訊，格式為：`[{"name: "標頭名稱", "value": "標內容"} …… ]`。

因JS傳遞Object時是參照傳遞，因此自訂函數不需要任何傳回值，只需要變更傳入的參數即可生效。例如，此語法會將`User-Agent`加上` HE/2.0.0`：

```javascript
for (let a in val) {
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

自2.3.0開始，自訂函數增加參數`detail`，用於實現更精確的控制

此參數為Object，且為唯讀參數。結構下列：

```javascript
{
	// 要求ID，自4.0.3可用
	"id": 123456,
	// 要求位址，如果有跳轉，此位址是跳轉後的位址
	"url": "http://example.com/example_redirected.js",
	// 要求方式，如GET、POST
	"method": "GET",
	// 是否為iframe的要求
	"isFrame": 0,
	// 資源類型
	"type": "script",
	// 要求發起的時間戳
	"time": 1505613357577.7522,
	// 要求發起時的URL，可能為空
	"originUrl": "http://example.com/"
}
```

可用類型參見[此处](https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/webRequest/ResourceType)

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
