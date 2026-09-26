---
title: Custom function
---

## Summary

Use custom functions to achieve more flexible functionality. So far, custom functions can be used in the following events: redirect request, modify the request headers, modify the response headers.

Custom functions are also limited by matching rules and exclusion rules. Only requests that meet the matching rules and do not satisfy the exclusion rule are processed by the custom function.

Note:
* The execution order of rules is not determined. Do not rely on the execution order to implement features.
* When you can use normal rules to complete the task, please try to use normal rules rather than custom functions

Custom function writing does **NOT** include the function head and tail, including only the function body. which is:

```javascript
function customFunction(val, detail) { // does not include this line
// The codes you need to write
} // does not include this line
```

For example:

![image](https://img13.360buyimg.com/ddimg/jfs/t1/302163/31/25689/8426/68a4ab87Fffa8fbd6/4581fc50eaa1b2dc.jpg)

The custom function takes the parameters `val` and `detail`. Where:
* `val` varies depending on the rule type.
  * When redirecting requests, this parameter is a string of the full URL;
  * When modifying request headers and response headers, this parameter is an array containing all header information;
  * When modifying the response body, this parameter is a string of the response body.
* `detail` is a new parameter added in version 2.3.0.
  * In most cases, this parameter is the same as the `detail` object below on this page.
  * When modifying the response body in Chrome, this parameter is different; see [Modify response body](./modify-body).
* The return type of the custom function varies depending on the rule type
  * When redirecting requests, the return value is a string of the new URL;
  * When modifying request headers and response headers, no value is returned;
  * When modifying the response body, the return value is the modified response body string;

## Redirect request

The incoming parameter `val` is a string of the full URL. If the function does not handle it, it can return `null` or the original parameter. For example, the following code redirects all `.jpg` to `.gif`:

```javascript
if (!val.includes('.jpg')) {
	return val;
}
return val.replace('.jpg', '.gif');
```

Since 4.0.3, return `_header_editor_cancel_` will cancel this request, for example:

```javascript
if (val.includes('utm_source')) {
	return '_header_editor_cancel_';
}
```

## Modify the request headers and response headers

The incoming parameter `val` is an array containing all header information in the following format: `[{"name": "header name", "value": "header content"} ... ]`.

This custom function does not need any return value, only needs to modify the incoming parameters to take effect. For example, this code will add ` HE/2.0.0` to the end of `User-Agent`:

```javascript
for (const item of val) {
	if (item.name.toLowerCase() === 'user-agent') {
		item.value += ' HE/2.0.0';
		break;
	}
}
```

Note: the browser requires that value must be String, i.e.

```javascript
const value = 123;
val.push({"name": "test", "value": value}); // Invalid, because value is number
val.push({"name": "test", "value": String(value)}); // Valid
```

## detail object

Since 2.3.0, the custom function adds the parameter `detail` for the more precise control

This parameter is Object and is a read-only parameter. The structure is as follows:

```javascript
{
	// Request id. Since 4.0.3
	id: 1234,
	// Request url. If this request has been redirected, this url is redirected url
	url: "http://example.com/example_redirected.png",
	// Tab ID. Note that this ID may be duplicated if user open multiple browser windows. Since 4.1.0
	tab: 2,
	// Request method, such as "GET", "POST", etc.
	method: "GET",
	// Request frame ID. Since 4.1.0
	frame: 123,
	// Request's parent frame ID. Since 4.1.0
	parentFrame: -1,
	// Request's proxy info. Since 4.1.0
	proxy: {
		host: "localhost",
		port: 8080
	},
	// Resource type
	type: "image",
	// Request time
	time: 1505613357577.7522,
	// URL of the resource which triggered the request. For example, if "https://example.com" contains a link, and the user clicks the link, then the originUrl for the resulting request is "https://example.com".
	originUrl: '',
	// URL of the document in which the resource will be loaded. Only available in Firefox.
	documentUrl: '',
	// Whether the request is from a private browsing window. Only available in Firefox.
	incognito: false,
	// The cookie store ID of the contextual identity. Only available in Firefox.
	cookieStoreId: 'firefox-default',
	// Contains request header if enable "Include request headers in custom function" and this time is response
	// May be null. Since 4.1.0
	requestHeaders: null
}
```

Available resource type see [here](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webRequest/ResourceType)

You can use this to implement some advanced features, for example, the following code will only redirect images and videos from example.com to example.org:

```javascript
if (detail.type === "media") {
	return val.replace("example.com", "example.org");
}
```

## How to debug a custom function

All custom functions are run in the background page, so to debug custom functions, open the console of the background page

* Chrome: Enable developer mode in `chrome://extensions/`, then click the "Inspect views" - "background page" or "Service Worker" at the bottom of Header Editor.
* Firefox: Open `about:debugging`, enable add-on debugging, click the "Inspect" next to Header Editor.
