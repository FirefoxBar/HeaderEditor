---
title: 規則
---

## 規則

HE 本身並不具備任何功能，它只是提供了管理和編寫規則的能力。您需要透過編寫規則，來實現相應的功能。

注意：規則的執行順序是不確定的。不要依賴於規則的執行順序來實現功能。

### 匹配類型

規則會應用到滿足相應匹配條件的URL上。若勾選了多個條件，則需同時滿足所有條件，才能應用此規則。

* 全部：對應所有URL。
* 正規表示式：
	* 支援標準的JS正規表示式。例如你輸入的正規表示式是`str`，那麼，實際上，程式內部就會使用`new RegExp(str)`初始化正規表示式。
	* 如果匹配規則是正規表示式，則修改結果（目前包括重新導向至）支援使用形似`$1`的佔位符。
	* 在[Mozilla Developer Network](https://developer.mozilla.org/zh-TW/docs/Web/JavaScript/Reference/Global_Objects/RegExp)上了解更多關於正規表示式的內容。
* 網址前綴：包括`https://`在內的網址前綴。
* 域名：包含子域名在內的完整的域名。
* 網址：包括“?”及之後的所有內容的完整位址。
* 要求方法：GET/POST等要求方法。
* 資源類型：網頁、圖片、CSS樣式等。

注意：
* 要求方法、資源類型只能在要求或排除中二選一配置。

### 排除規則

不論是否滿足匹配規則，只要滿足了任一排除條件，那麼此條均不會對目前URL生效。

* 精簡版不支援在排除中配置正規表示式。

### 運行模式

規則有兩種運行模式：DNR 模式（declarativeNetRequest）和 Web Request 模式。

* DNR 模式：效能更好，但不支援自動解碼、自訂函數、正規表示式排除。
* Web Request 模式：效能稍差，但功能全面。

### 自訂函數

透過自訂函數實現更靈活的功能，具體使用請參見[此處](./custom-function)

* 精簡版不支援該功能。

## 其他特殊功能

* 使用功能“修改要求標頭”或“修改回應標頭”時，將標頭內容設定為`_header_editor_remove_`將會移除此標頭（自3.0.5起有效）
* 使用功能“重新導向要求”且使用自訂函數時，返回`_header_editor_cancel_`將阻止此要求（自4.0.3開始有效）

## 其他注意事項

* 將標頭內容設定為空，不同瀏覽器對此處理方式不同。Chrome將會保留此標頭資訊，但其內容為空。Firefox則會移除此標頭資訊。
* 瀏覽器會限制對特定 URL 的修改，例如在 Chrome 及類似瀏覽器（如360瀏覽器）中，擴充功能無權修改以`chrome.google.com/webstore`開頭的任何要求。

## 常見功能範例

下面的例子不保證均有效，只作為範例，用於幫助使用者熟悉Header Editor的規則編寫

#### 反-防盜鏈

使用說明：將URL匹配至圖片域名，功能為“修改要求標頭”，將標頭內容Referer修改為任意可顯示圖片的網址。下列有一些常用的規則：

前綴為`http://imgsrc.baidu.com/`，修改Referer為`http://tieba.baidu.com`

正規表示式為`http://(\w?\.?)hiphotos\.baidu\.com/`，修改Referer為`http://tieba.baidu.com`

#### 重新導向要求

例如，將Google公共庫重新導向至中科大的鏡像上：

正規表示式為`^http(s?)://(ajax|fonts)\.googleapis\.com/(.*)`，重新導向至`https://$2.proxy.ustclug.org/$3`

將所有對`sale.jd.com`、`item.jd.com`、`www.jd.com`的HTTP要求重新導向到HTTPS：

正規表示式為`http://(sale|item|www).jd.com`，重新導向至`https://$1.jd.com`

將所有維基百科的HTTP要求重新導向至HTTPS：

正規表示式為`^http://([^\/]+\.wikipedia\.org/.+)`，重新導向至`https://$1`

#### 偽裝UA

修改要求標頭的`User-Agent`即可，但功能只能影響伺服器判斷UA的能力，對於在本地透過JS判斷的，無法偽裝
