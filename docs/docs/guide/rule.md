---
nav: 指南
group:
  title: 常用功能
  order: 2
title: 规则
order: 1
---

## 规则

HE本身并不具备任何功能，它只是提供了管理和编写规则的能力。您需要通过编写规则，来实现相应的功能。

### 匹配类型

规则会应用到满足相应匹配条件的URL上。

* 全部：对应所有URL，包括Header Editor自身。
* 正则表达式：
	* 支持标准的JS正则表达式。例如你输入的正则表达式是`str`，那么，实际上，程序内部就会使用`new RegExp(str)`初始化正则表达式。
	* 如果匹配规则是正则表达式，则修改结果（目前包括重定向至）支持使用形似`$1`的占位符
	* 在[Mozilla Developer Network](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/RegExp)上了解更多关于正则表达式的内容
* 网址前缀：包括`http://`在内的网址前缀
* 域名：包含子域名在内的完整的域名
* 网址：包括“?”及之后的所有内容的完整地址

### 排除规则

不论是否满足匹配规则，只要满足了排除规则，那么此条均不会对当前URL生效

### 自定义函数

通过自定义函数实现更灵活的功能，具体使用请参见[此处](./custom-function.md)

## 其他特殊功能

* 使用功能“修改请求头”或“修改响应头”时，将头内容设置为`_header_editor_remove_`将会移除此头（自3.0.5起有效）

* 使用功能“重定向请求”且使用自定义函数时，返回`_header_editor_cancel_`将阻止此请求（自4.0.3开始有效）

## 其他注意事项

* 将头内容设置为空，不同浏览器对此处理方式不同。Chrome将会保留此头信息，但其内容为空。Firefox则会移除此头信息

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
