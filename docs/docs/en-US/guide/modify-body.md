---
title: Modify response body
---

## Read Before Use

This feature allows you to modify the response body of a request.

Using this feature may cause the following issues:
* Access speed and resource usage may be affected to some extent.
* Some content downloads may be affected.

On Chrome, you may see a prompt indicating that `"Header Editor" started debugging this browser`. This is because HE uses the [chrome.debugger API](https://developer.chrome.com/docs/extensions/reference/api/debugger). If you prefer not to see this prompt, you can:
* Disable "Modify Response Body" in "Options".
* Add the `--silent-debugger-extension-api` parameter when running Chrome.

## Configuration

### Invalid Configurations
In Chrome, the following configurations are invalid. We may fix those in the future:
* Match types - method, resource type
* Exclude rule - method, resource type

In Firefox, all configurations are valid.

### Encoding
HE uses UTF-8 to decode transmitted content by default. If the website is not encoded in UTF-8, you will need to manually specify the encoding.

Please note that this encoding is only used for decoding. The modified response is always encoded in UTF-8.

If you don't know the encoding used by a webpage, open the console (press F12), switch to the Network tab, refresh the current page, and observe the Content-Type in the Response Headers.

[Encoding list](https://developer.mozilla.org/en-US/docs/Web/API/Encoding_API/Encodings)

### Request Stage

In Chrome, you can choose when to intercept the request.

* Request
  * The request isn't actually sent to the server, and you can't access the server's response headers or body.
  * In most cases, you may need to manually configure the `Content-Type`.
  * Intercepting at this phase offers better performance because you don't need to wait for a response from the server.
* Response
  * The response is received from the server, and you need to wait for it.
  * You can access the server's response headers and body in a custom function.

In Firefox, this is always the response stage.

### Custom Function
The function takes two parameters: the first is the decoded text, and the second is the custom function's detail object. The function returns the modified text.

For example, the following function replaces all occurrences of "baidu" on a webpage with "Google."
```js
return val.replace(/baidu/g, 'Google');
```

You can use `detail.browser` to get the browser type, which can be either `chrome` or `firefox`.
* In Firefox, the detail object is the same as in the [custom function](./custom-function).
* In Chrome, the detail object format is [Fetch.requestPaused](https://chromedevtools.github.io/devtools-protocol/tot/Fetch/#event-requestPaused).
