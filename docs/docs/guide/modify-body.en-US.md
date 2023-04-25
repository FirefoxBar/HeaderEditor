---
group:
  title: Advanced
title: Modify response body
order: 2
---

## Before use

This feature can modify the response body, but it has the following requirements:
* Use Firefox 57+
* Check "Modify the response body (only supports Firefox)" in the options of HE

If you enable this feature, you may have the following problems:
* To some extent affect access speed and resource occupation
  * Regardless of whether you have written relevant rules, HE will intercept the request data.
* Affects some content downloads

## How to use

> As of now, this feature only supports custom functions.

### Encoding
You need to specify the webpage encoding in order for HE to decode the data.

If you don't know what encoding the webpage uses, please open the console (press F12), switch to the Network tab, refresh the current page, and observe the Content-Type in the Response Headers.

### Function writing
The function has two parameters: the first parameter is the decoded text, and the second parameter is the detail object of the custom function. Returns the modified text.

Detail object please see [custom function](custom-function.md) document

For example, the following function will replace all "baidu" in the page with "Google"
```js
return val.replace(/baidu/g, 'Google');
```
