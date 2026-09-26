---
title: 修改回應主體
---

## 使用前必讀

該功能可以修改要求的回應主體。

如果使用了此功能，可能會有以下問題：
* 一定程度上影響存取速度和資源佔用。
* 影響部分內容下載。

在 Chrome 上，您會看到`“Header Editor”已開始偵錯此瀏覽器`的提示，這是因為HE使用了[chrome.debugger API](https://developer.chrome.com/docs/extensions/reference/api/debugger)。如果您不想看到此提示，您可以：
* 在「選項」中停用「修改回應主體」。
* 執行 Chrome 時，新增`--silent-debugger-extension-api`參數。

## 配置指南

### 編碼
HE 預設使用 UTF-8 來解碼傳輸的內容。如果網站並非 UTF-8 編碼，則您需要手動指定編碼。

請注意，該編碼僅用於解碼。修改後的回應固定以 UTF-8 編碼。

如果您不知道網頁使用何種編碼，請開啟主控台（按F12），切換到 Network/網路 標籤，重新整理目前頁面，觀察 Response Headers/回應標頭 中的 Content-Type。

[完整編碼列表](https://developer.mozilla.org/en-US/docs/Web/API/Encoding_API/Encodings)

### 要求階段

在 Chrome 下，您可以選擇在何時攔截要求。
* 要求階段
  * 要求不會真正傳送到伺服器，您也無法取得服務端的回應標頭或回應主體。
  * 多數情況下，您可能需要手動設定`Content-Type`。
  * 此階段攔截效能更高，因為您不需要等待服務端的回應。
* 回應階段
  * 回應會從伺服器取得，您需要等待服務端的回應。
  * 您可以在自訂函數中取得伺服器的回應標頭和回應主體。

在 Firefox 下，固定為回應階段。

### 自訂函數

函數共有兩個參數：`val` 參數初始情況下為解碼後的文字（可能因有多條規則而變化），`detail` 參數為自訂函數的 detail 物件。返回修改後的文字或 Uint8Array。

若有多個修改回應主體的函數，則後一函數始終接收到的是前一函數的返回值，因此 `val` 也可能為 Uint8Array。

例如，下面函數會將網頁中的所有「baidu」替換為「Google」
```js
if (typeof val === 'string') {
  return val.replace(/baidu/g, 'Google');
}
```

您可以透過 `detail` 物件取得更多資訊：
* `detail.browser` 取得瀏覽器類型，取值為 `chrome` 或 `firefox`。
* `detail.rawResponse` 取得原始回應主體。

在不同瀏覽器下，detail 物件的格式不同：
| 說明項目 | Chrome | Firefox |
| --- | --- | --- |
| detail 物件格式 | [Fetch.requestPaused](https://chromedevtools.github.io/devtools-protocol/tot/Fetch/#event-requestPaused) | 與[自訂函數](./custom-function)中一致 |
| `detail.rawResponse` | `{ base64Encoded: boolean, body: string }` | `Uint8Array` |

## 已知問題

* 在 Chrome 上，當新分頁首次存取網站時，回應修改不會生效。
