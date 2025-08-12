---
title: 规则
---

## 规则

HE本身并不具备任何功能，它只是提供了管理和编写规则的能力。您需要通过编写规则，来实现相应的功能。

### 匹配类型

规则会应用到满足相应匹配条件的URL上。如果檢查多個條件，則必須同時滿足所有條件才能套用此規則。

* 全部：对应所有URL，包括Header Editor自身。
* 正規表示式：
	* 支援標準的JS正規表示式。例如你輸出的正規表示式是`str`，那麼，實際上，程式內部就會使用`new RegExp(str)`初始化正規表示式。
	* 如果對應規則是正規表示式，則變更結果（目前包括重新導向至）支援使用形似`$1`的預留位置。
	* 在[Mozilla Developer Network](https://developer.mozilla.org/zh-TW/docs/Web/JavaScript/Reference/Global_Objects/RegExp)上了解更多关于正则表达式的内容
* 網址首碼：包括`http://`在內的網址首碼。
* 域名：包含子域名在內的完整的域名。
* 網址：包括“?”及之後的所有內容的完整位址。
* 方法：GET/POST 等請求方法。
* 資源類型：網頁、圖片、CSS 樣式等。

注意：
* 方法和資源類型只能在匹配类型或排除中配置一個。

### 排除

無論符合規則是否滿足，只要滿足任一排除條件，此項都不會對目前 URL 生效。
* 精簡版不支援在排除中配置正規表示式。

### 自定义函数

通过自定义函数实现更灵活的功能，具体使用请参见[此处](./custom-function)

## 其他特殊功能

* 使用功能“修改请求头”或“修改响应头”时，将头内容设置为`_header_editor_remove_`将会移除此头（自3.0.5起有效）
* 使用功能“重定向请求”且使用自定义函数时，返回`_header_editor_cancel_`将阻止此请求（自4.0.3开始有效）

## 其他注意事项

* 将头内容设置为空，不同浏览器对此处理方式不同。Chrome将会保留此头信息，但其内容为空。Firefox则会移除此头信息。
* 瀏覽器限制修改特定的 URL。例如，在 Chrome 和類似瀏覽器（如 360 瀏覽器）中，擴充功能無權修改任何以`chrome.google.com/webstore`開頭的請求。

## 常见功能示例

下面的例子不保证均有效，只作为示例，用于帮助用户熟悉Header Editor的规则编写

#### 反-防盗链

使用说明：将URL匹配至图片域名，功能为“修改请求头”，将头内容Referer修改为任意可显示图片的网址。下列有一些常用的规则：

前缀为`http://imgsrc.baidu.com/`，修改Referer为`http://tieba.baidu.com`

正则表达式为`http://(\w?\.?)hiphotos\.baidu\.com/`，修改Referer为`http://tieba.baidu.com`

#### 重定向请求

例如，将Google公共库重定向至中科大的镜像上：

正则表达式为`^http(s?)://(ajax|fonts)\.googleapis\.com/(.*)`，重定向至`https://$2.proxy.ustclug.org/$3`

将所有对`sale.jd.com`、`item.jd.com`、`www.jd.com`的HTTP请求重定向到HTTPS：

正则表达式为`http://(sale|item|www).jd.com`，重定向至`https://$1.jd.com`

将所有维基百科的HTTP请求重定向至HTTPS：

正则表达式为`^http://([^\/]+\.wikipedia\.org/.+)`，重定向至`https://$1`

#### 伪装UA

修改请求头的User-Agent即可，但功能只能影响服务器判断UA的能力，对于在本地通过JS判断的，无法伪装
