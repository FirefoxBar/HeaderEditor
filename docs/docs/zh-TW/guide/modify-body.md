---
title: 修改回應主體
---

## 使用前須知

此功能可讓您修改請求的回應主體。

使用此功能可能會導致以下問題：
* 存取速度和資源使用率可能會受到一定影響。
* 部分內容下載可能會受到影響。

在 Chrome 瀏覽器中，您會看到提示`“Header Editor”已開始偵錯此瀏覽器`。這是因為 HE 使用了 [chrome.debugger API](https://developer.chrome.com/docs/extensions/reference/api/debugger)。如果您不想看到此提示，您可以：
* 在「選項」中停用「修改回應主體」。
* 在執行 Chrome 瀏覽器時新增 `--silent-debugger-extension-api` 參數。

## 配置

### 編碼
HE 預設使用 UTF-8 解碼傳輸的內容。如果網站未使用 UTF-8 編碼，您需要手動指定編碼。

請注意，此編碼僅用於解碼。修改後的回應始終採用 UTF-8 編碼。

如果您不知道網頁使用的編碼，請開啟控制台（按 F12），切換到「網路」選項卡，刷新目前頁面，然後觀察回應標頭中的 Content-Type。

[編碼列表](https://developer.mozilla.org/en-US/docs/Web/API/Encoding_API/Encodings)

### 請求階段

在 Chrome 中，您可以選擇何時攔截請求。

* 請求
  * 請求實際上並未傳送到伺服器，您無法存取伺服器的回應標頭或正文。
  * 在大多數情況下，您可能需要手動設定`Content-Type`。
  * 在此階段攔截可提供更好的效能，因為您無需等待伺服器的回應。
* 回應
  * 已從伺服器收到回應，您需要等待它。
  * 您可以在自訂函數中存取伺服器的回應標頭和正文。

在 Firefox 中，始終是回應階段。

### 自訂函數
此函數接受兩個參數：第一個參數是解碼後的文本，第二個參數是自訂函數的 detail 物件。該函數傳回修改後的文字。

例如，以下函數將網頁上所有出現的“baidu”替換為“Google”。
```js
return val.replace(/baidu/g, 'Google');
```

您可以使用 `detail.browser` 取得瀏覽器類型，可以是 `chrome` 或 `firefox`。
* 在 Firefox 中，detail 物件與 [自訂函數](./custom-function) 中的相同。
* 在 Chrome 中，detail 物件的格式為 [Fetch.requestPaused](https://chromedevtools.github.io/devtools-protocol/tot/Fetch/#event-requestPaused)。

## 已知問題

* 在 Chrome 中，在新分頁中首次造訪網站時，回應修改不會生效。
