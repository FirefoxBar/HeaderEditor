---
title: FAQ
---

## "Header Editor" started debugging this browser

On Chrome, you'll see this prompt when the response body modification feature is enabled. If you don't want to see this prompt, you can:
* Disable "Modify Response Body" in "Options".
* Add the `--silent-debugger-extension-api` parameter when running Chrome.

## Why is "header name" reduced to lowercase?

[RFC 2616](https://tools.ietf.org/html/rfc2616.html#section-4.2) says:

> Each header field consists of a name followed by a colon `(":")` and the field value. Field names are case-insensitive.

So, since 4.0.0, Header Editor will reduce "header name" to lowercase. Except for custom functions: the custom function will still get the original header (except that it has been modified by other rules)

## Response header modification not taking effect

Developer tools (including Chrome and Firefox) do not display modified response headers. This result is inaccurate, so please refer to the actual results.

For example, modifying `content-type` to `text/plain` can make a webpage display as plain text, indicating that the modification was successful. However, the developer tools still show `text/html`.

![2025-09-03_115619.png](https://img10.360buyimg.com/ddimg/jfs/t1/325127/5/15269/85767/68b7bc80F3d770c5e/45cdb64f42625693.jpg)

## All rules are ineffective

In rare cases, some rules may fail to initialize due to syntax errors, resulting in all rules being ineffective.

In this case, you can find the specific rule and modify or disable it using the following methods:

Chrome:
* Open `chrome://extensions/?id=eningockdidmgiojffjmkdblpjocbhgh`
* Enable "Developer Mode" in the upper right corner
* Click "Service Worker" under "Inspect View"
* Find the error message and check the ID, corresponding rule, and error message.
![img](https://img11.360buyimg.com/ddimg/jfs/t1/333577/33/836/91910/68a4ab26F2b85cd64/8d6cd3da3b9af51a.jpg)

Firefox:
* Open `about:debugging`
* Find "Header Editor" and click the "Inspect" button on the right.
* Find the corresponding rule and error message.
![img](https://img13.360buyimg.com/ddimg/jfs/t1/289605/39/18012/32092/68a4ae2cFa61f9a6a/9be7525f36abe945.jpg)

## Can I delete a header in a simple way?

Yes, just modify it to `_header_editor_remove_`

## Rules disappear

As we know, the rules will disappear or not work

**Note: Before doing all of the following, please back up your Chrome/Firefox profile folder!**

### Not work in Private Mode

Popup panel and management page is not work in Private Mode of Firefox. But the main features are available

#### Chrome

* Open `chrome://extensions/?id=eningockdidmgiojffjmkdblpjocbhgh`, enable "Enabled in incognito mode"

#### Firefox

* Open about:debugging, find the Internal UUID of Header Editor (e.g. d52e1cf2-22e5-448d-a882-e68f3211fa76).
* Open Firefox options.
* Go to Privacy & Security.
* Set History mode to "Use custom settings".
* Click "Exceptions".
* Paste our URL: `moz-extension://{Internal UUID}/` (the `{Internal UUID}` is the Internal UUID of Header Editor you found in step one), for example, `moz-extension://d52e1cf2-22e5-448d-a882-e68f3211fa76/`, Then click 'Allow'.
* Click "Save Changes".

### Rules automatically deleted in Firefox

Thanks to [Thorin-Oakenpants](https://github.com/Thorin-Oakenpants) and [henshin](https://github.com/henshin)

* Open `about:config`, make sure that `dom.indexedDB.enabled` is `true`
* Try to change `extensions.webextensions.keepUuidOnUninstall` into true, is your problem solved?
* Open your Firefox profile folder, if there are many files (about a thousand or more) named prefs-xxxx.js files with 0 bytes, closed firefox and deleted them.

## Other questions?

Just [submit a issue](https://github.com/FirefoxBar/HeaderEditor/issues/new/choose)
