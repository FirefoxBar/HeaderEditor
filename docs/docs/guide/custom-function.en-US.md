---
group:
  title: Advanced
  order: 3
title: Custom function
order: 1
---

## Summary

Use custom functions to achieve more flexible functionality. So far, custom functions can be used in the following events: redirect request, modify the request headers, modify the response headers.

Custom functions are also limited by matching rules and exclusion rules. Only requests that meet the matching rules and do not satisfy the exclusion rule are processed by the custom function.

The priority of the custom function is not determined. It may be possible to customize the function earlier than the normal rule to the request, or it may be later. The order of execution of multiple custom functions is also variable.

When you can use normal rules to complete the case, please try to use the general rules, rather than custom function

Custom function writing does **NOT** include the function head and tail, including only the function body. which is:

```javascript
function(val, detail) { // does not include this line
// The codes you need to write
} // does not include this line
```

For example:

![image](https://user-images.githubusercontent.com/5326684/54876966-6bd6c480-4e53-11e9-8e9d-6c950f8b5cd2.png)

The custom function passes the arguments `val` and `detail`, where `detail` is the new parameter in version 2.3.0, see the description below. The return type varies depending on the rule type.

## Redirect request

Pass the string with the full URL, if the function is not processed to return NULL or the original argument. For example, the following code will add a `_test` to every request:

```javascript
if (val.includes('_test.')) {
	return val;
}
const a = val.lastIndexOf('.');
if (a < 0) {
	return val;
} else {
	return val.substr(0, a) + '_test' + val.substr(a);
}
```

Since 4.0.3, return `_header_editor_cancel_` will cancel this request, for example:

```javascript
if (val.includes('utm_source')) {
	return '_header_editor_cancel_';
}
```

## Modify the request headers and response headers

The incoming parameter is an array containing all header information in the following format: `[{"name: "header name", "value": "header content"} ... ]`.

Because JS pass the Object by reference, the custom function does not need any return value, only need to modify the incoming parameters to take effect. For example, this code will add ` HE/2.0.0` to the end of `User-Agent`:

```javascript
for (const a in val) {
	if (val[a].name.toLowerCase() === 'user-agent') {
		val[a].value += ' HE/2.0.0';
		break;
	}
}
```

Note: the browser requires that value must be String, i.e.

```javascript
let value = 123;
val.push({"name": "test", "value": value}); //Invalid, because value is number
val.push({"name": "test", "value": value.toString()}); //Valid
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
	// Since 4.1.0
	originUrl: '',
	// URL of the document in which the resource will be loaded. Only avaliable in Firefox. Since 4.1.0
	documentUrl: '',
	// Contains request header if enable "Include request headers in custom function" and this time is response
	// May be null. Since 4.1.0
	requestHeaders: null
}
```

Available resource type see [here](https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/webRequest/ResourceType)

You can use this to implement some advanced features, for example, the following code will only redirect images and videos from example.com to example.org:

```javascript
if (detail.type === "media") {
	return val.replace("example.com", "example.org");
}
```

## How to debug a custom function

All custom functions are run in the background page, so to debug custom functions, open the console of the background page

Chrome: Enable developer mode in `chrome://extensions/`, then click the "Inspect views" - "background page" at the bottom of Header Editor

Firefox: Open `about:debugging`, enable add-on debugging, click the "Debug" at the bottom of Header Editor
