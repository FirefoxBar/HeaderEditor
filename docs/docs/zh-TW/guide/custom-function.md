---
title: 自訂函數
---

## 綜述

使用自訂函數可以實現更靈活的功能。目前為止，自訂函數可以在以下事件中使用：重新導向要求、變更要求標頭、變更回應標頭。

自訂函數也受匹配規則和排除規則的限制。只有滿足匹配規則且不滿足排除規則的要求會被自訂函數處理。

注意：
* 規則的執行順序是不確定的。不要依賴規則的執行順序來實現功能。
* 在可以使用一般規則完成的情況下，請盡量使用一般規則，而不是自訂函數

自訂函數編寫**不包括**函數頭尾，只包括函數主體。即：

```javascript
function customFunction(val, detail) { //不包括這一行
// 你需要編寫的部分
} //不包括這一行
```

例如：

![image](https://img13.360buyimg.com/ddimg/jfs/t1/302163/31/25689/8426/68a4ab87Fffa8fbd6/4581fc50eaa1b2dc.jpg)

自訂函數會傳入參數 `val` 和 `detail`。其中：
* `val` 根據規則類型不同而不同。
  * 重新導向要求時，此參數為完整URL的字串；
  * 變更要求標頭和回應標頭時，此參數為一個陣列，包含所有標頭資訊；
  * 修改回應主體時，此參數為回應主體的字串。
* `detail` 是2.3.0版本新增的參數。
  * 在大多數情況下，此參數與本頁面下方的`detail`物件相同。
  * 在 Chrome 中修改回應主體時，此參數有區別；詳見[修改回應主體](./modify-body)。
* 自訂函數的返回類型根據規則類型不同而不同
  * 重新導向要求時，返回值為新URL的字串；
  * 變更要求標頭和回應標頭時，不返回任何值；
  * 修改回應主體時，返回值為修改後的回應主體字串；

## 重新導向要求

傳入參數 `val` 為完整URL的字串，若函數不處理可返回 `null` 或原參數。例如，下面程式碼會將`.jpg`均重新導向為`.gif`：

```javascript
if (!val.includes('.jpg')) {
	return val;
}
return val.replace('.jpg', '.gif');
```

自4.0.3起，返回 `_header_editor_cancel_` 可取消此要求，如：

```javascript
if (val.includes('utm_source')) {
	return '_header_editor_cancel_';
}
```

## 變更要求標頭和回應標頭

傳入參數 `val` 為一個陣列，包含所有標頭資訊，格式為：`[{"name": "標頭名稱", "value": "標頭內容"} …… ]`。

該自訂函數不需要任何返回值，只需要修改傳入的參數即可生效。例如，此程式碼會將 `User-Agent` 加上 ` HE/2.0.0`：

```javascript
for (const item of val) {
	if (item.name.toLowerCase() === 'user-agent') {
		item.value += ' HE/2.0.0';
		break;
	}
}
```

注意：瀏覽器要求value必須是String，即：

```javascript
const value = 123;
val.push({"name": "test", "value": value}); // 不合法，因為 value 是 number
val.push({"name": "test", "value": String(value)}); // 合法
```

## detail 物件

自2.3.0開始，自訂函數增加參數`detail`，用於實現更精確的控制

此參數為 Object，且為唯讀參數。結構如下：

```javascript
{
	// 要求ID，自4.0.3可用
	id: 1234,
	// 要求位址，如果有跳轉，此位址是跳轉後的位址
	url: "http://example.com/example_redirected.png",
	// 分頁ID，注意如果使用者開啟了多個瀏覽器視窗，這個ID可能會重複，自4.1.0可用
	tab: 2,
	// 要求方式，如GET、POST
	method: "GET",
	// 要求所屬的frame ID，自4.1.0可用
	frame: 123,
	// 要求所屬的frame的父級ID，自4.1.0可用
	parentFrame: -1,
	// 要求目前的代理資訊，可能為null，自4.1.0可用
	proxy: {
		host: "localhost",
		port: 8080
	},
	// 資源類型
	type: "image",
	// 要求發起的時間戳記
	time: 1505613357577.7522,
	// 觸發此要求的URL，例如在頁面A上點擊了連結B，則B中可以透過此參數取得A的位址。可能為空
	originUrl: '',
	// 資源將會被載入到的位址，僅Firefox可用，可能為空
	documentUrl: '',
	// 要求是否來自隱私瀏覽視窗，僅Firefox可用
	incognito: false,
	// 要求頁面容器id，僅Firefox可用
	cookieStoreId: 'firefox-default',
	// 如果開啟了「在自訂函數中包含要求標頭」且此次觸發是在回應時，則此處是要求時的標頭資訊，可能為null，自4.1.0可用
	requestHeaders: null
}
```

可用資源類型見[此處](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webRequest/ResourceType)

您可以藉此實現一些進階功能，例如，下面的程式碼只會將example.com網域下的圖片和影片重新導向到example.org：

```javascript
if (detail.type === "media") {
	return val.replace("example.com", "example.org");
}
```

## 如何除錯自訂函數

所有自訂函數的運行均位於背景頁面，因此，要除錯自訂函數，請開啟背景頁面的主控台

* Chrome：在`chrome://extensions/`中，啟用「開發者模式」，點擊 Header Editor 下方的「檢查檢視」-「背景頁」或「Service Worker」
* Firefox：開啟`about:debugging`，啟用附加元件除錯，點擊 Header Editor 旁邊的「檢查」
